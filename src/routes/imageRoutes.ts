import express from "express";
import * as imageController from "../controllers/imageController";
import { protect } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Upload a single image
router.post(
  "/:projectId/upload",
  upload.single("image"),
  imageController.uploadImage,
);

// Upload multiple images
router.post(
  "/:projectId/batch-upload",
  upload.array("images", 50), // Allow up to 50 images
  imageController.uploadMultipleImages,
);

// Get all images for a project
router.get("/:projectId", imageController.getProjectImages);

// Get all batch names for a project
router.get("/:projectId/batches", imageController.getProjectBatches);

// Delete an image
router.delete("/:imageId", imageController.deleteImage);

// Update image status
router.patch("/:imageId/status", imageController.updateImageStatus);

export default router;
