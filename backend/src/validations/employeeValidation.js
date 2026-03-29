import { body, query } from 'express-validator';
import { EMPLOYEE_STATUSES, EMPLOYMENT_TYPES } from '../utils/constants.js';

const optionalDate = (field, message) =>
  body(field)
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage(message)
    .toDate();

export const employeePayloadValidation = [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Email must be valid'),
  body('phone').optional({ values: 'falsy' }).trim(),
  body('address').optional({ values: 'falsy' }).trim(),
  body('gender').optional({ values: 'falsy' }).trim(),
  optionalDate('dateOfBirth', 'Date of birth must be a valid date'),
  body('joinDate').isISO8601().withMessage('Join date must be valid').toDate(),
  body('department').optional({ values: 'falsy' }).trim(),
  body('designation').optional({ values: 'falsy' }).trim(),
  body('reportingManager').optional({ values: 'falsy' }).trim(),
  body('workLocation').optional({ values: 'falsy' }).trim(),
  body('employmentType')
    .optional({ values: 'falsy' })
    .isIn(EMPLOYMENT_TYPES)
    .withMessage(`Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}`),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(EMPLOYEE_STATUSES)
    .withMessage(`Status must be one of: ${EMPLOYEE_STATUSES.join(', ')}`),
];

export const employeeUpdateValidation = [
  body('fullName').optional({ values: 'falsy' }).trim(),
  body('phone').optional({ values: 'falsy' }).trim(),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Email must be valid'),
  body('address').optional({ values: 'falsy' }).trim(),
  body('gender').optional({ values: 'falsy' }).trim(),
  optionalDate('dateOfBirth', 'Date of birth must be valid'),
  body('joinDate').optional({ values: 'falsy' }).isISO8601().withMessage('Join date must be valid').toDate(),
  body('department').optional({ values: 'falsy' }).trim(),
  body('designation').optional({ values: 'falsy' }).trim(),
  body('reportingManager').optional({ values: 'falsy' }).trim(),
  body('workLocation').optional({ values: 'falsy' }).trim(),
  body('employmentType').optional({ values: 'falsy' }).isIn(EMPLOYMENT_TYPES),
  body('status').optional({ values: 'falsy' }).isIn(EMPLOYEE_STATUSES),
  body('firstLoginCompleted').optional().isBoolean(),
];

export const employeeListValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional({ values: 'falsy' }).trim(),
  query('department').optional({ values: 'falsy' }).trim(),
  query('designation').optional({ values: 'falsy' }).trim(),
  query('status').optional({ values: 'falsy' }).isIn(EMPLOYEE_STATUSES),
];
