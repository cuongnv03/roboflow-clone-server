import express from "express";
import { body } from "express-validator";
import * as projectController from "../controllers/projectController";
import { protect } from "../middleware/auth";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Project routes
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Project name is required"),
    body("type")
      .isIn([
        "object_detection",
        "classification",
        "instance_segmentation",
        "keypoint_detection",
        "multimodal",
      ])
      .withMessage("Invalid project type"),
  ],
  projectController.createProject,
);

router.get("/", projectController.getAllProjects);
router.get("/:projectId", projectController.getProject);
router.get("/:projectId/stats", projectController.getProjectStats);

router.put(
  "/:projectId",
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Project name cannot be empty"),
    body("type")
      .optional()
      .isIn([
        "object_detection",
        "classification",
        "instance_segmentation",
        "keypoint_detection",
        "multimodal",
      ])
      .withMessage("Invalid project type"),
  ],
  projectController.updateProject,
);

router.delete("/:projectId", projectController.deleteProject);

// Class routes within projects
router.post(
  "/:projectId/classes",
  [
    body("name").trim().notEmpty().withMessage("Class name is required"),
    body("color")
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage("Color must be a valid hex color"),
  ],
  projectController.createClass,
);

router.get("/:projectId/classes", projectController.getProjectClasses);

router.put(
  "/classes/:classId",
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Class name cannot be empty"),
    body("color")
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage("Color must be a valid hex color"),
  ],
  projectController.updateClass,
);

router.delete("/classes/:classId", projectController.deleteClass);

export default router;
