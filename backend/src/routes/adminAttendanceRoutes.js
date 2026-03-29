import express from 'express';
import { getAdminWeekAttendance } from '../controllers/attendanceController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  authenticateUser,
  authorizeAdmin,
} from '../middleware/authMiddleware.js';
import { adminWeekQueryValidation } from '../validations/attendanceValidation.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(authenticateUser, authorizeAdmin);

router.get('/week', adminWeekQueryValidation, validateRequest, asyncHandler(getAdminWeekAttendance));

export default router;
