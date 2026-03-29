import express from 'express';
import {
  loginEmployee,
  verifyEmployeeLoginOtp,
  resendEmployeeLoginOtp,
  changeEmployeePassword,
} from '../controllers/authController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  authenticateUser,
  authorizeEmployee,
} from '../middleware/authMiddleware.js';
import {
  employeeLoginValidation,
  employeeVerifyOtpValidation,
  employeeResendOtpValidation,
  employeeChangePasswordValidation,
} from '../validations/authValidation.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/login', employeeLoginValidation, validateRequest, asyncHandler(loginEmployee));
router.post('/verify-otp', employeeVerifyOtpValidation, validateRequest, asyncHandler(verifyEmployeeLoginOtp));
router.post('/resend-otp', employeeResendOtpValidation, validateRequest, asyncHandler(resendEmployeeLoginOtp));
router.post(
  '/change-password',
  authenticateUser,
  authorizeEmployee,
  employeeChangePasswordValidation,
  validateRequest,
  asyncHandler(changeEmployeePassword)
);

export default router;
