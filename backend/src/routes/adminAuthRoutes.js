import express from 'express';
import {
  loginAdmin,
  verifyAdminLoginOtp,
  resendAdminLoginOtp,
  createAdminUser,
} from '../controllers/authController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  authenticateUser,
  authorizeAdmin,
} from '../middleware/authMiddleware.js';
import {
  adminLoginValidation,
  adminVerifyOtpValidation,
  adminResendOtpValidation,
  createAdminValidation,
} from '../validations/authValidation.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/login', adminLoginValidation, validateRequest, asyncHandler(loginAdmin));
router.post('/verify-otp', adminVerifyOtpValidation, validateRequest, asyncHandler(verifyAdminLoginOtp));
router.post('/resend-otp', adminResendOtpValidation, validateRequest, asyncHandler(resendAdminLoginOtp));

router.post(
  '/create-admin',
  authenticateUser,
  authorizeAdmin,
  createAdminValidation,
  validateRequest,
  asyncHandler(createAdminUser)
);

export default router;
