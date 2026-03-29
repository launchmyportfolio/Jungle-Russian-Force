import { body } from 'express-validator';

const otpValidation = body('otp')
  .trim()
  .matches(/^\d{6}$/)
  .withMessage('OTP must be a 6-digit code');

export const sendOtpValidation = [];

export const changeUsernameWithOtpValidation = [
  otpValidation,
  body('currentPassword').trim().notEmpty().withMessage('Current password is required'),
  body('newUsername')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('New username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('New username can only contain letters, numbers, dot, underscore, and dash'),
];

export const changePasswordWithOtpValidation = [
  otpValidation,
  body('currentPassword').trim().notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .trim()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .bail()
    .matches(/^(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage('New password must include at least one uppercase letter and one number'),
];
