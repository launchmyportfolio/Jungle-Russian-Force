import express from 'express';
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  authenticateUser,
  authorizeAdmin,
} from '../middleware/authMiddleware.js';
import {
  employeePayloadValidation,
  employeeUpdateValidation,
  employeeListValidation,
} from '../validations/employeeValidation.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { mongoIdParamValidation } from '../validations/commonValidation.js';

const router = express.Router();

router.use(authenticateUser, authorizeAdmin);

router.post('/', employeePayloadValidation, validateRequest, asyncHandler(createEmployee));
router.get('/', employeeListValidation, validateRequest, asyncHandler(getEmployees));
router.put(
  '/:id',
  mongoIdParamValidation,
  employeeUpdateValidation,
  validateRequest,
  asyncHandler(updateEmployee)
);
router.delete('/:id', mongoIdParamValidation, validateRequest, asyncHandler(deleteEmployee));

export default router;
