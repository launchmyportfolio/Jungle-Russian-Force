import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';
import { getCookieOptions } from '../config/cookieOptions.js';
import { hashPassword, comparePassword } from '../services/authService.js';
import { createToken } from '../services/tokenService.js';
import { ApiError } from '../utils/apiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { sendOtpEmail } from '../utils/sendEmail.js';
import { COOKIE_TOKEN_NAME } from '../middleware/authMiddleware.js';

const parsePositiveInt = (rawValue, fallback) => {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const OTP_EXPIRY_MINUTES = parsePositiveInt(process.env.OTP_EXPIRY_MINUTES, 5);
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
const OTP_RESEND_COOLDOWN_SECONDS = parsePositiveInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 30);
const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000;
const OTP_MAX_ATTEMPTS = parsePositiveInt(process.env.OTP_MAX_ATTEMPTS, 5);
const OTP_BLOCK_MINUTES = 10;
const OTP_BLOCK_MS = OTP_BLOCK_MINUTES * 60 * 1000;

const mapAdminProfile = (admin) => ({
  id: admin._id,
  username: admin.username,
  role: 'admin',
});

const mapEmployeeProfile = (employee) => ({
  id: employee._id,
  employeeId: employee.employeeId,
  fullName: employee.fullName,
  name: employee.fullName,
  email: employee.email,
  department: employee.department || '',
  designation: employee.designation || '',
  role: 'employee',
  joinDate: employee.joinDate,
  status: employee.status,
  firstLoginCompleted: Boolean(employee.firstLoginCompleted),
});

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_TOKEN_NAME, token, getCookieOptions());
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const clearOtpState = (account) => {
  account.otpHash = '';
  account.otpExpiresAt = null;
  account.otpAttempts = 0;
  account.otpBlockedUntil = null;
};

const resetExpiredOtpBlock = (account) => {
  if (!account.otpBlockedUntil) return false;
  if (account.otpBlockedUntil.getTime() > Date.now()) return false;

  account.otpBlockedUntil = null;
  account.otpAttempts = 0;
  return true;
};

const ensureOtpNotBlocked = (account) => {
  if (!account.otpBlockedUntil) return;
  if (account.otpBlockedUntil.getTime() <= Date.now()) return;

  throw new ApiError(429, `Maximum OTP attempts reached. Try again in ${OTP_BLOCK_MINUTES} minutes.`);
};

const getOtpCooldownRemainingSeconds = (account) => {
  const lastSentAt = account.otpLastSentAt ? account.otpLastSentAt.getTime() : 0;
  if (!lastSentAt) return 0;

  const expiresAt = lastSentAt + OTP_RESEND_COOLDOWN_MS;
  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) return 0;

  return Math.ceil(remainingMs / 1000);
};

const ensureOtpCooldown = (account) => {
  const secondsRemaining = getOtpCooldownRemainingSeconds(account);
  if (secondsRemaining > 0) {
    throw new ApiError(429, `Please wait ${secondsRemaining} seconds before requesting a new OTP.`);
  }
};

const sendLoginOtp = async ({ account, to, subject }) => {
  if (!to) {
    throw new ApiError(400, 'Email is not configured for OTP verification');
  }

  const didReset = resetExpiredOtpBlock(account);
  if (didReset) {
    await account.save();
  }

  ensureOtpNotBlocked(account);
  ensureOtpCooldown(account);

  const otp = generateOtp();
  const previousState = {
    otpHash: account.otpHash,
    otpExpiresAt: account.otpExpiresAt,
    otpAttempts: account.otpAttempts,
    otpLastSentAt: account.otpLastSentAt,
    otpBlockedUntil: account.otpBlockedUntil,
  };

  account.otpHash = await hashPassword(otp);
  account.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  account.otpAttempts = 0;
  account.otpBlockedUntil = null;
  account.otpLastSentAt = new Date();
  await account.save();

  try {
    await sendOtpEmail({
      to,
      subject,
      otp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    account.otpHash = previousState.otpHash;
    account.otpExpiresAt = previousState.otpExpiresAt;
    account.otpAttempts = previousState.otpAttempts;
    account.otpLastSentAt = previousState.otpLastSentAt;
    account.otpBlockedUntil = previousState.otpBlockedUntil;
    await account.save();
    throw error;
  }
};

const verifyOtpOrThrow = async (account, otp) => {
  const didReset = resetExpiredOtpBlock(account);
  if (didReset) {
    await account.save();
  }

  ensureOtpNotBlocked(account);

  if (!account.otpHash || !account.otpExpiresAt) {
    throw new ApiError(400, 'OTP is not available. Please login again.');
  }

  if (account.otpExpiresAt.getTime() <= Date.now()) {
    clearOtpState(account);
    account.otpLastSentAt = null;
    await account.save();
    throw new ApiError(400, 'OTP expired. Please login again.');
  }

  const validOtp = await comparePassword(otp, account.otpHash);
  if (validOtp) {
    clearOtpState(account);
    account.otpLastSentAt = null;
    await account.save();
    return;
  }

  account.otpAttempts = (account.otpAttempts || 0) + 1;
  if (account.otpAttempts >= OTP_MAX_ATTEMPTS) {
    account.otpBlockedUntil = new Date(Date.now() + OTP_BLOCK_MS);
  }
  await account.save();

  if (account.otpAttempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, `Maximum OTP attempts reached. Try again in ${OTP_BLOCK_MINUTES} minutes.`);
  }

  throw new ApiError(400, 'Invalid OTP');
};

const getAdminOtpEmail = (admin) => {
  const envEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (envEmail) return envEmail;

  return (admin?.email || '').trim().toLowerCase();
};

const getEmployeeOtpEmail = (employee) => {
  return (employee?.email || '').trim().toLowerCase();
};

const sendOtpChallenge = (res, data, message) => {
  return sendSuccess(
    res,
    {
      ...data,
      requiresOtp: true,
      otpExpiryMinutes: OTP_EXPIRY_MINUTES,
      resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    },
    message
  );
};

const createLoginResponse = (res, role, account) => {
  const token = createToken({ userId: account._id.toString(), role });
  setAuthCookie(res, token);

  return sendSuccess(
    res,
    {
      token,
      user: role === 'admin' ? mapAdminProfile(account) : mapEmployeeProfile(account),
    },
    role === 'admin' ? 'Admin login successful' : 'Employee login successful'
  );
};

export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = username.trim().toLowerCase();

  const admin = await Admin.findOne({ username: normalizedUsername });
  if (!admin) throw new ApiError(401, 'Invalid credentials');

  const isValid = await comparePassword(password, admin.passwordHash);
  if (!isValid) throw new ApiError(401, 'Invalid credentials');

  const adminEmail = getAdminOtpEmail(admin);
  await sendLoginOtp({
    account: admin,
    to: adminEmail,
    subject: 'JRF Admin Login OTP',
  });

  return sendOtpChallenge(res, { username: normalizedUsername }, 'OTP sent to admin email');
};

export const verifyAdminLoginOtp = async (req, res) => {
  const { username, otp } = req.body;
  const normalizedUsername = username.trim().toLowerCase();

  const admin = await Admin.findOne({ username: normalizedUsername });
  if (!admin) throw new ApiError(401, 'Invalid OTP request');

  await verifyOtpOrThrow(admin, otp);
  return createLoginResponse(res, 'admin', admin);
};

export const resendAdminLoginOtp = async (req, res) => {
  const { username } = req.body;
  const normalizedUsername = username.trim().toLowerCase();

  const admin = await Admin.findOne({ username: normalizedUsername });
  if (!admin) throw new ApiError(401, 'Invalid OTP request');

  if (!admin.otpHash || !admin.otpExpiresAt) {
    throw new ApiError(400, 'OTP verification is not started. Please login first.');
  }

  const adminEmail = getAdminOtpEmail(admin);
  await sendLoginOtp({
    account: admin,
    to: adminEmail,
    subject: 'JRF Admin Login OTP',
  });

  return sendOtpChallenge(res, { username: normalizedUsername }, 'OTP sent to admin email');
};

export const loginEmployee = async (req, res) => {
  const { employeeId, password } = req.body;
  const normalizedEmployeeId = employeeId.trim().toUpperCase();

  const employee = await Employee.findOne({ employeeId: normalizedEmployeeId });
  if (!employee) throw new ApiError(401, 'Invalid credentials');

  const isValid = await comparePassword(password, employee.passwordHash);
  if (!isValid) throw new ApiError(401, 'Invalid credentials');

  if (employee.status !== 'Active') {
    throw new ApiError(403, 'Employee account is inactive');
  }

  const employeeEmail = getEmployeeOtpEmail(employee);
  await sendLoginOtp({
    account: employee,
    to: employeeEmail,
    subject: 'JRF Employee Login OTP',
  });

  return sendOtpChallenge(
    res,
    { employeeId: normalizedEmployeeId },
    'OTP sent to employee email'
  );
};

export const verifyEmployeeLoginOtp = async (req, res) => {
  const { employeeId, otp } = req.body;
  const normalizedEmployeeId = employeeId.trim().toUpperCase();

  const employee = await Employee.findOne({ employeeId: normalizedEmployeeId });
  if (!employee) throw new ApiError(401, 'Invalid OTP request');

  if (employee.status !== 'Active') {
    throw new ApiError(403, 'Employee account is inactive');
  }

  await verifyOtpOrThrow(employee, otp);
  return createLoginResponse(res, 'employee', employee);
};

export const resendEmployeeLoginOtp = async (req, res) => {
  const { employeeId } = req.body;
  const normalizedEmployeeId = employeeId.trim().toUpperCase();

  const employee = await Employee.findOne({ employeeId: normalizedEmployeeId });
  if (!employee) throw new ApiError(401, 'Invalid OTP request');

  if (employee.status !== 'Active') {
    throw new ApiError(403, 'Employee account is inactive');
  }

  if (!employee.otpHash || !employee.otpExpiresAt) {
    throw new ApiError(400, 'OTP verification is not started. Please login first.');
  }

  const employeeEmail = getEmployeeOtpEmail(employee);
  await sendLoginOtp({
    account: employee,
    to: employeeEmail,
    subject: 'JRF Employee Login OTP',
  });

  return sendOtpChallenge(
    res,
    { employeeId: normalizedEmployeeId },
    'OTP sent to employee email'
  );
};

export const getCurrentSession = async (req, res) => {
  if (req.auth.role === 'admin') {
    const admin = await Admin.findById(req.auth.userId);
    if (!admin) throw new ApiError(401, 'Session expired');
    return sendSuccess(res, { user: mapAdminProfile(admin), role: 'admin' }, 'Session active');
  }

  const employee = await Employee.findById(req.auth.userId);
  if (!employee) throw new ApiError(401, 'Session expired');

  return sendSuccess(
    res,
    { user: mapEmployeeProfile(employee), role: 'employee' },
    'Session active'
  );
};

export const logoutSession = async (_req, res) => {
  res.clearCookie(COOKIE_TOKEN_NAME, getCookieOptions());
  return sendSuccess(res, {}, 'Logged out successfully');
};

export const createAdminUser = async (req, res) => {
  const { username, password } = req.body;
  const normalized = username.toLowerCase();

  const existing = await Admin.findOne({ username: normalized });
  if (existing) throw new ApiError(409, 'Admin username already exists');

  const passwordHash = await hashPassword(password);
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const admin = await Admin.create({
    username: normalized,
    passwordHash,
    email: adminEmail || undefined,
  });

  return sendSuccess(res, { user: mapAdminProfile(admin) }, 'Admin created', 201);
};

export const changeEmployeePassword = async (req, res) => {
  const currentPassword = typeof req.body.currentPassword === 'string'
    ? req.body.currentPassword.trim()
    : '';
  const { newPassword } = req.body;
  const employee = await Employee.findById(req.auth.userId);
  if (!employee) throw new ApiError(404, 'Employee not found');

  // On first login, allow password setup without requiring current password.
  if (employee.firstLoginCompleted) {
    if (!currentPassword) {
      throw new ApiError(400, 'Current password is required');
    }

    const isValid = await comparePassword(currentPassword, employee.passwordHash);
    if (!isValid) throw new ApiError(401, 'Current password is incorrect');
  }

  employee.passwordHash = await hashPassword(newPassword);
  employee.firstLoginCompleted = true;
  await employee.save();

  return sendSuccess(res, {}, 'Password updated successfully');
};
