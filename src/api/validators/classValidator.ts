import { body } from "express-validator";
import { validate } from "../middlewares/validate";

export const createClassValidator = [
  body("name").trim().notEmpty().withMessage("Class name is required"),
  body("color")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Color must be a valid hex color"),
  validate,
];

export const updateClassValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Class name cannot be empty"),
  body("color")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Color must be a valid hex color"),
  validate,
];
