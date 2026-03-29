import { body, query } from 'express-validator';
import { ATTENDANCE_STATUSES } from '../utils/constants.js';

export const markWeekValidation = [
  body('entries').isArray({ min: 1 }).withMessage('Entries are required'),
  body('entries.*.date').isISO8601().withMessage('Date must be valid').toDate(),
  body('entries.*.status').isIn(ATTENDANCE_STATUSES).withMessage('Status is invalid'),
  body('entries.*.remarks').optional({ values: 'falsy' }).trim(),
];

export const weekQueryValidation = [
  query('startDate').optional({ values: 'falsy' }).isISO8601().withMessage('startDate must be valid'),
  query('endDate').optional({ values: 'falsy' }).isISO8601().withMessage('endDate must be valid'),
];

export const adminWeekQueryValidation = [
  ...weekQueryValidation,
  query('search').optional({ values: 'falsy' }).trim(),
  query('department').optional({ values: 'falsy' }).trim(),
  query('designation').optional({ values: 'falsy' }).trim(),
  query('status').optional({ values: 'falsy' }).isIn(['Active', 'Inactive']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
];

export const monthlyReportValidation = [
  query('month').isInt({ min: 1, max: 12 }).withMessage('month must be 1-12').toInt(),
  query('year').isInt({ min: 2000, max: 9999 }).withMessage('year must be valid').toInt(),
];
