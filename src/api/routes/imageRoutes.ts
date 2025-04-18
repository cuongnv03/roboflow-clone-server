import { Router } from "express";
import { ImageController } from "../controllers/ImageController";
import { ImageService } from "../../domain/services/impl/ImageService";
import { ImageRepository } from "../../domain/repositories/impl/ImageRepository";
import { ProjectRepository } from "../../domain/repositories/impl/ProjectRepository";
import { StorageFactory } from "../../infrastructure/storage/StorageFactory";
import { authMiddleware } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import { updateImageStatusValidator } from "../validators/imageValidator";
import { UserRepository } from "../../domain/repositories/impl/UserRepository";
import { AuthService } from "../../domain/services/impl/AuthService";

const router = Router();

// Initialize repositories
const imageRepository = new ImageRepository();
const projectRepository = new ProjectRepository();
const userRepository = new UserRepository();

// Initialize services
const authService = new AuthService(userRepository);
const storageProvider = StorageFactory.createProvider("local");
const imageService = new ImageService(
  imageRepository,
  projectRepository,
  storageProvider,
);

// Initialize controller
const imageController = new ImageController(imageService);

// Middleware
const auth = authMiddleware(authService);

// Apply auth middleware to all routes
router.use(auth);

// Upload a single image
router.post(
  "/:projectId/images/upload",
  upload.single("image"),
  imageController.uploadImage,
);

// Upload multiple images
router.post(
  "/:projectId/images/batch-upload",
  upload.array("images", 50), // Allow up to 50 images
  imageController.uploadMultipleImages,
);

// Get all images for a project
router.get("/:projectId/images", imageController.getProjectImages);

// Get all batch names for a project
router.get("/:projectId/images/batches", imageController.getProjectBatches);

// Delete an image
router.delete("/:projectId/images/:imageId", imageController.deleteImage);

// Update image status
router.patch(
  "/:projectId/images/:imageId/status",
  updateImageStatusValidator,
  imageController.updateImageStatus,
);

export default router;
