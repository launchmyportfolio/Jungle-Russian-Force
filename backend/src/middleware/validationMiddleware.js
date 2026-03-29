import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';

export const validateRequest = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array();
    const firstErrorMessage = details[0]?.msg || 'Validation failed';
    return next(new ApiError(400, firstErrorMessage, details));
  }

  return next();
};
