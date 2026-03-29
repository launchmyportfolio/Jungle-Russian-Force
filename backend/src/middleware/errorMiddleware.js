import { ApiError } from '../utils/apiError.js';
import { sendError } from '../utils/apiResponse.js';

export const notFoundHandler = (req, res) => {
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
};

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  if (err.name === 'ValidationError') {
    return sendError(res, 'Validation failed', 400, err.errors);
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    return sendError(res, 'Duplicate value found', 409, err.keyValue);
  }

  console.error(err);
  return sendError(res, 'Internal server error', 500);
};
