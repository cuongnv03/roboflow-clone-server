import { Router } from "express";
import { DatasetController } from "../controllers/DatasetController";
import { DatasetService } from "../../domain/services/impl/DatasetService";
import { ExportService } from "../../domain/services/impl/ExportService";
import { DatasetRepository } from "../../domain/repositories/impl/DatasetRepository";
import { ProjectRepository } from "../../domain/repositories/impl/ProjectRepository";
import { ImageRepository } from "../../domain/repositories/impl/ImageRepository";
import { AnnotationRepository } from "../../domain/repositories/impl/AnnotationRepository";
import { ClassRepository } from "../../domain/repositories/impl/ClassRepository";
import { StorageFactory } from "../../infrastructure/storage/StorageFactory";
import { authMiddleware } from "../middlewares/auth";
import {
  createDatasetValidator,
  splitDatasetValidator,
  assignToSplitValidator,
  exportDatasetValidator,
} from "../validators/datasetValidator";
import { UserRepository } from "../../domain/repositories/impl/UserRepository";
import { AuthService } from "../../domain/services/impl/AuthService";

const router = Router();

// Initialize repositories
const datasetRepository = new DatasetRepository();
const projectRepository = new ProjectRepository();
const imageRepository = new ImageRepository();
const annotationRepository = new AnnotationRepository();
const classRepository = new ClassRepository();
const userRepository = new UserRepository();
const storageProvider = StorageFactory.createProvider(
  (process.env.STORAGE_TYPE as any) || "local",
);

// Initialize services
const authService = new AuthService(userRepository);
const exportService = new ExportService(
  datasetRepository,
  projectRepository,
  imageRepository,
  annotationRepository,
  classRepository,
  storageProvider,
);
const datasetService = new DatasetService(
  datasetRepository,
  projectRepository,
  imageRepository,
  annotationRepository,
  exportService,
);

// Initialize controller
const datasetController = new DatasetController(datasetService, exportService);

// Middleware
const auth = authMiddleware(authService);

// Apply auth middleware to all routes
router.use(auth);

router.get("/formats", datasetController.getExportFormats);

router.get("/project/:projectId", datasetController.getProjectDatasets);

// Dataset routes
router.post("/", createDatasetValidator, datasetController.createDataset);

router.get("/:datasetId", datasetController.getDataset);

router.delete("/:datasetId", datasetController.deleteDataset);

router.post(
  "/:datasetId/split",
  splitDatasetValidator,
  datasetController.generateSplit,
);

router.post(
  "/:datasetId/assign",
  assignToSplitValidator,
  datasetController.assignImagesToSplit,
);

router.get("/:datasetId/images", datasetController.getDatasetImages);

router.post(
  "/:datasetId/export",
  exportDatasetValidator,
  datasetController.exportDataset,
);

router.get(
  "/:datasetId/export-preview",
  datasetController.generateExportPreview,
);

export default router;
