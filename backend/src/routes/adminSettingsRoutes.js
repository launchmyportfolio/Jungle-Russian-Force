import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticateUser, authorizeAdmin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import {
  sendAdminSettingsOtp,
  changeAdminUsernameWithOtp,
  changeAdminPasswordWithOtp,
} from '../controllers/adminSettingsController.js';
import {
  sendOtpValidation,
  changeUsernameWithOtpValidation,
  changePasswordWithOtpValidation,
} from '../validations/adminSettingsValidation.js';

const router = express.Router();

router.use(authenticateUser, authorizeAdmin);

router.post('/send-otp', sendOtpValidation, validateRequest, asyncHandler(sendAdminSettingsOtp));
router.post(
  '/change-username',
  changeUsernameWithOtpValidation,
  validateRequest,
  asyncHandler(changeAdminUsernameWithOtp)
);
router.post(
  '/change-password',
  changePasswordWithOtpValidation,
  validateRequest,
  asyncHandler(changeAdminPasswordWithOtp)
);

export default router;
