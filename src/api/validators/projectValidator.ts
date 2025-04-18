import { body } from 'express-validator';
import { validate } from '../middlewares/validate';

export const createProjectValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required'),
  body('type')
    .isIn([
      'object_detection',
      'classification',
      'instance_segmentation',
      'keypoint_detection',
      'multimodal'
    ])
    .withMessage('Invalid project type'),
  validate
];

export const updateProjectValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project name cannot be empty'),
  body('type')
    .optional()
    .isIn([
      'object_detection',
      'classification',
      'instance_segmentation',
      'keypoint_detection',
      'multimodal'
    ])
    .withMessage('Invalid project type'),
  validate
];