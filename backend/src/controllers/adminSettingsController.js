import Admin from '../models/Admin.js';
import { comparePassword, hashPassword } from '../services/authService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { sendOtpEmail } from '../utils/sendEmail.js';

const parsedOtpExpiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES);
const OTP_EXPIRY_MINUTES = Number.isFinite(parsedOtpExpiryMinutes) && parsedOtpExpiryMinutes > 0
  ? parsedOtpExpiryMinutes
  : 5;
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
const OTP_RESEND_WINDOW_MS = 60 * 60 * 1000;
const OTP_RESEND_LIMIT = 3;
const OTP_VERIFY_LIMIT = 5;
const OTP_VERIFY_BLOCK_MS = 10 * 60 * 1000;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const clearOtpState = (admin) => {
  admin.otpHash = '';
  admin.otpExpiresAt = null;
  admin.otpAttempts = 0;
  admin.otpBlockedUntil = null;
};

const getAdminOrThrow = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin) throw new ApiError(404, 'Admin not found');
  return admin;
};

const getAdminEmail = (admin) => {
  const fromEnv = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (fromEnv) return fromEnv;
  return (admin.email || '').trim().toLowerCase();
};

const ensureVerifyNotBlocked = (admin) => {
  if (!admin.otpBlockedUntil) return;
  if (admin.otpBlockedUntil.getTime() <= Date.now()) return;
  throw new ApiError(429, 'Maximum OTP attempts reached. Try again in 10 minutes.');
};

const verifyOtpOrThrow = async (admin, otp) => {
  ensureVerifyNotBlocked(admin);

  if (!admin.otpHash || !admin.otpExpiresAt) {
    throw new ApiError(400, 'OTP is required. Please send OTP again.');
  }

  if (admin.otpExpiresAt.getTime() <= Date.now()) {
    clearOtpState(admin);
    await admin.save();
    throw new ApiError(400, 'OTP expired. Please request a new OTP.');
  }

  const valid = await comparePassword(otp, admin.otpHash);
  if (valid) return;

  admin.otpAttempts = (admin.otpAttempts || 0) + 1;

  if (admin.otpAttempts >= OTP_VERIFY_LIMIT) {
    admin.otpBlockedUntil = new Date(Date.now() + OTP_VERIFY_BLOCK_MS);
  }

  await admin.save();

  if (admin.otpAttempts >= OTP_VERIFY_LIMIT) {
    throw new ApiError(429, 'Maximum OTP attempts reached. Try again in 10 minutes.');
  }

  throw new ApiError(400, 'Invalid OTP');
};

export const sendAdminSettingsOtp = async (req, res) => {
  const admin = await getAdminOrThrow(req.auth.userId);
  ensureVerifyNotBlocked(admin);

  const email = getAdminEmail(admin);
  if (!email) {
    throw new ApiError(400, 'Admin email is not configured');
  }

  const now = Date.now();
  const lastSentAtMs = admin.otpLastSentAt ? admin.otpLastSentAt.getTime() : 0;
  const inResendWindow = lastSentAtMs && (now - lastSentAtMs) < OTP_RESEND_WINDOW_MS;

  if (!inResendWindow) {
    admin.otpResendCount = 0;
  }

  const resendCount = (admin.otpResendCount || 0) + 1;
  if (resendCount > OTP_RESEND_LIMIT) {
    throw new ApiError(429, 'OTP resend limit reached. Try again after 1 hour.');
  }

  const otp = generateOtp();
  const previousOtpState = {
    otpHash: admin.otpHash,
    otpExpiresAt: admin.otpExpiresAt,
    otpAttempts: admin.otpAttempts,
    otpResendCount: admin.otpResendCount,
    otpLastSentAt: admin.otpLastSentAt,
    otpBlockedUntil: admin.otpBlockedUntil,
  };

  admin.email = email;
  admin.otpHash = await hashPassword(otp);
  admin.otpExpiresAt = new Date(now + OTP_EXPIRY_MS);
  admin.otpAttempts = 0;
  admin.otpBlockedUntil = null;
  admin.otpResendCount = resendCount;
  admin.otpLastSentAt = new Date(now);
  await admin.save();

  try {
    await sendOtpEmail({
      to: email,
      subject: 'JRF Admin OTP Verification',
      otp,
      expiryMinutes: Math.max(1, OTP_EXPIRY_MINUTES),
    });
  } catch (error) {
    admin.otpHash = previousOtpState.otpHash;
    admin.otpExpiresAt = previousOtpState.otpExpiresAt;
    admin.otpAttempts = previousOtpState.otpAttempts;
    admin.otpResendCount = previousOtpState.otpResendCount;
    admin.otpLastSentAt = previousOtpState.otpLastSentAt;
    admin.otpBlockedUntil = previousOtpState.otpBlockedUntil;
    await admin.save();
    throw error;
  }

  return sendSuccess(res, {}, 'OTP sent to admin email');
};

export const changeAdminUsernameWithOtp = async (req, res) => {
  const { currentPassword, otp, newUsername } = req.body;
  const normalizedUsername = newUsername.trim().toLowerCase();
  const admin = await getAdminOrThrow(req.auth.userId);

  const currentPasswordValid = await comparePassword(currentPassword, admin.passwordHash);
  if (!currentPasswordValid) throw new ApiError(401, 'Current password is incorrect');

  const existingAdmin = await Admin.findOne({
    username: normalizedUsername,
    _id: { $ne: admin._id },
  });
  if (existingAdmin) throw new ApiError(409, 'Username already exists');

  await verifyOtpOrThrow(admin, otp);

  admin.username = normalizedUsername;
  clearOtpState(admin);
  admin.otpResendCount = 0;
  await admin.save();

  return sendSuccess(res, {}, 'Admin username updated successfully');
};

export const changeAdminPasswordWithOtp = async (req, res) => {
  const { currentPassword, otp, newPassword } = req.body;
  const admin = await getAdminOrThrow(req.auth.userId);

  const currentPasswordValid = await comparePassword(currentPassword, admin.passwordHash);
  if (!currentPasswordValid) throw new ApiError(401, 'Current password is incorrect');

  const isSamePassword = await comparePassword(newPassword, admin.passwordHash);
  if (isSamePassword) {
    throw new ApiError(400, 'New password must be different from current password');
  }

  await verifyOtpOrThrow(admin, otp);

  admin.passwordHash = await hashPassword(newPassword);
  clearOtpState(admin);
  admin.otpResendCount = 0;
  await admin.save();

  return sendSuccess(res, {}, 'Admin password updated successfully');
};
