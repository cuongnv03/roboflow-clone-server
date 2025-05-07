import { Router } from "express";
import { AnnotationController } from "../controllers/AnnotationController";
import { AnnotationService } from "../../domain/services/impl/AnnotationService";
import { AnnotationRepository } from "../../domain/repositories/impl/AnnotationRepository";
import { ImageRepository } from "../../domain/repositories/impl/ImageRepository";
import { ProjectRepository } from "../../domain/repositories/impl/ProjectRepository";
import { authMiddleware } from "../middlewares/auth";
import {
  createAnnotationValidator,
  updateAnnotationValidator,
  batchAnnotationValidator,
} from "../validators/annotationValidator";
import { UserRepository } from "../../domain/repositories/impl/UserRepository";
import { AuthService } from "../../domain/services/impl/AuthService";

const router = Router();

// Initialize repositories
const annotationRepository = new AnnotationRepository();
const imageRepository = new ImageRepository();
const projectRepository = new ProjectRepository();
const userRepository = new UserRepository();

// Initialize services
const authService = new AuthService(userRepository);
const annotationService = new AnnotationService(
  annotationRepository,
  imageRepository,
  projectRepository,
);

// Initialize controller
const annotationController = new AnnotationController(annotationService);

// Middleware
const auth = authMiddleware(authService);

// Apply auth middleware to all routes
router.use(auth);

// Routes
router.post(
  "/",
  createAnnotationValidator,
  annotationController.createAnnotation,
);

router.get("/images/:imageId", annotationController.getImageAnnotations);

router.put(
  "/:annotationId",
  updateAnnotationValidator,
  annotationController.updateAnnotation,
);

router.delete("/:annotationId", annotationController.deleteAnnotation);

router.post(
  "/batch",
  batchAnnotationValidator,
  annotationController.batchCreateAnnotations,
);

export default router;
