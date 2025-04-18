import { body } from 'express-validator';
import { validate } from '../middlewares/validate';

export const updateImageStatusValidator = [
  body('status')
    .isIn(['uploaded', 'annotated', 'processed'])
    .withMessage('Status must be one of: uploaded, annotated, processed'),
  validate
];