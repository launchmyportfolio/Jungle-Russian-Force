import express from 'express';
import {
  markWeekAttendance,
  getEmployeeWeekAttendance,
} from '../controllers/attendanceController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  authenticateUser,
  authorizeEmployee,
} from '../middleware/authMiddleware.js';
import {
  markWeekValidation,
  weekQueryValidation,
} from '../validations/attendanceValidation.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(authenticateUser, authorizeEmployee);

router.post('/mark-week', markWeekValidation, validateRequest, asyncHandler(markWeekAttendance));
router.get('/week/:employeeId?', weekQueryValidation, validateRequest, asyncHandler(getEmployeeWeekAttendance));

export default router;
