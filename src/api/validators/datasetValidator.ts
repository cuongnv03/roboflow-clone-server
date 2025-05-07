import { body, query } from "express-validator";
import { validate } from "../middlewares/validate";

export const createDatasetValidator = [
  body("name").trim().notEmpty().withMessage("Dataset name is required"),
  body("projectId")
    .isInt({ min: 1 })
    .withMessage("Valid project ID is required"),
  validate,
];

export const splitDatasetValidator = [
  body("strategy")
    .isIn(["random", "manual"])
    .withMessage("Strategy must be either random or manual"),
  body("ratio")
    .if(body("strategy").equals("random"))
    .notEmpty()
    .withMessage("Ratio is required for random strategy")
    .custom((value) => {
      if (value.train + value.valid + value.test !== 1) {
        throw new Error("Ratio values must sum to 1");
      }
      return true;
    }),
  body("manualAssignments")
    .if(body("strategy").equals("manual"))
    .isArray()
    .withMessage("Manual assignments must be an array"),
  validate,
];

export const assignToSplitValidator = [
  body("imageIds")
    .isArray({ min: 1 })
    .withMessage("At least one image ID is required"),
  body("split")
    .isIn(["train", "valid", "test"])
    .withMessage("Split must be one of: train, valid, test"),
  validate,
];

export const exportDatasetValidator = [
  body("format")
    .isIn(["coco", "yolo", "pascal_voc", "createml", "tensorflow"])
    .withMessage(
      "Supported formats: coco, yolo, pascal_voc, createml, tensorflow",
    ),
  body("includeImages")
    .isBoolean()
    .withMessage("includeImages must be a boolean"),
  body("exportSplits")
    .isArray({ min: 1 })
    .withMessage("At least one split must be selected")
    .custom((value) => {
      const validSplits = ["train", "valid", "test"];
      return value.every((split) => validSplits.includes(split));
    })
    .withMessage("Splits must be one of: train, valid, test"),
  validate,
];
