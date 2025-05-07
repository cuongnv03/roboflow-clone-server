import { body } from "express-validator";
import { validate } from "../middlewares/validate";

export const createAnnotationValidator = [
  body("imageId").isInt({ min: 1 }).withMessage("Valid image ID is required"),
  body("classId").isInt({ min: 1 }).withMessage("Valid class ID is required"),
  body("data").notEmpty().withMessage("Annotation data is required"),
  validate,
];

export const updateAnnotationValidator = [
  body("classId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Valid class ID is required"),
  body("data")
    .optional()
    .notEmpty()
    .withMessage("Annotation data cannot be empty"),
  body("isValid")
    .optional()
    .isBoolean()
    .withMessage("isValid must be a boolean"),
  validate,
];

export const batchAnnotationValidator = [
  body("imageId").isInt({ min: 1 }).withMessage("Valid image ID is required"),
  body("annotations")
    .isArray({ min: 1 })
    .withMessage("At least one annotation is required"),
  body("annotations.*.classId")
    .isInt({ min: 1 })
    .withMessage("Valid class ID is required for all annotations"),
  body("annotations.*.data")
    .notEmpty()
    .withMessage("Data is required for all annotations"),
  validate,
];
