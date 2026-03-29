import { body } from 'express-validator';

const otpValidation = body('otp')
  .trim()
  .matches(/^\d{6}$/)
  .withMessage('OTP must be a 6-digit code');

export const adminLoginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').trim().notEmpty().withMessage('Password is required'),
];

export const adminVerifyOtpValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  otpValidation,
];

export const adminResendOtpValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
];

export const employeeLoginValidation = [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('password').trim().notEmpty().withMessage('Password is required'),
];

export const employeeVerifyOtpValidation = [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  otpValidation,
];

export const employeeResendOtpValidation = [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
];

const buildNewPasswordValidation = () => body('newPassword')
  .trim()
  .notEmpty()
  .withMessage('New password is required')
  .bail()
  .isLength({ min: 6 })
  .withMessage('New password must be at least 6 characters long');

export const changePasswordValidation = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required'),
  buildNewPasswordValidation(),
];

export const employeeChangePasswordValidation = [
  body('currentPassword')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Current password must be text')
    .trim(),
  buildNewPasswordValidation(),
];

export const createAdminValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
