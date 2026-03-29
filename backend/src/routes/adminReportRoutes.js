import express from 'express';
import { getMonthlyReport } from '../controllers/attendanceController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  authenticateUser,
  authorizeAdmin,
} from '../middleware/authMiddleware.js';
import { monthlyReportValidation } from '../validations/attendanceValidation.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(authenticateUser, authorizeAdmin);

router.get('/monthly', monthlyReportValidation, validateRequest, asyncHandler(getMonthlyReport));

export default router;
