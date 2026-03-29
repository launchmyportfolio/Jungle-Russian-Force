import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';
import { verifyToken } from '../services/tokenService.js';
import { ApiError } from '../utils/apiError.js';

const COOKIE_NAME = 'accessToken';

export const authenticateUser = async (req, _res, next) => {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    const token = req.cookies[COOKIE_NAME] || bearer;
    if (!token) {
      throw new ApiError(401, 'Unauthorized');
    }

    const payload = verifyToken(token);
    req.auth = payload;

    if (payload.role === 'admin') {
      req.currentUser = await Admin.findById(payload.userId).lean();
    }

    if (payload.role === 'employee') {
      req.currentUser = await Employee.findById(payload.userId).lean();
    }

    if (!req.currentUser) {
      throw new ApiError(401, 'Session is invalid. Please login again');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeAdmin = (req, _res, next) => {
  if (req.auth?.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }
  return next();
};

export const authorizeEmployee = (req, _res, next) => {
  if (req.auth?.role !== 'employee') {
    return next(new ApiError(403, 'Employee access required'));
  }

  if (req.currentUser?.status !== 'Active') {
    return next(new ApiError(403, 'Employee account is inactive'));
  }

  return next();
};

export const COOKIE_TOKEN_NAME = COOKIE_NAME;
