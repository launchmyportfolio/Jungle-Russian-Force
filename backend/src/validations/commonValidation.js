import { param } from 'express-validator';

export const mongoIdParamValidation = [
  param('id').isMongoId().withMessage('Invalid id'),
];
