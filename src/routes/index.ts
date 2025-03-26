import express, { RequestHandler } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
} from "../controllers/userController";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} from "../controllers/workspaceController";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/projectController";
import {
  addClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
} from "../controllers/classController";
import {
  uploadImage,
  getImages,
  uploadVideo,
} from "../controllers/imageController";
import {
  addAnnotation,
  getAnnotations,
  getAnnotationById,
  updateAnnotation,
  deleteAnnotation,
} from "../controllers/annotationController";
import {
  createDataset,
  getDatasets,
  getDatasetDetails,
  getDatasetById,
  updateDataset,
  deleteDataset,
  getDatasetImages,
  addImageToDataset,
  removeImageFromDataset,
  generateDataset,
} from "../controllers/datasetController";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Authentication routes
router.post("/auth/register", registerUser as RequestHandler);
router.post("/auth/login", loginUser as RequestHandler);
router.post("/auth/logout", authenticateToken, logoutUser as RequestHandler);
router.get("/users/me", authenticateToken, getUser as RequestHandler);

// Workspace routes
router.post(
  "/workspaces",
  authenticateToken,
  createWorkspace as RequestHandler,
);
router.get("/workspaces", authenticateToken, getWorkspaces as RequestHandler);
router.get(
  "/workspaces/:workspace_id",
  authenticateToken,
  getWorkspaceById as RequestHandler,
);
router.put(
  "/workspaces/:workspace_id",
  authenticateToken,
  updateWorkspace as RequestHandler,
);
router.delete(
  "/workspaces/:workspace_id",
  authenticateToken,
  deleteWorkspace as RequestHandler,
);

// Project routes
router.post(
  "/workspaces/:workspace_id/projects",
  authenticateToken,
  createProject as RequestHandler,
);
router.get(
  "/workspaces/:workspace_id/projects",
  authenticateToken,
  getProjects as RequestHandler,
);
router.get(
  "/projects/:project_id",
  authenticateToken,
  getProjectById as RequestHandler,
);
router.put(
  "/projects/:project_id",
  authenticateToken,
  updateProject as RequestHandler,
);
router.delete(
  "/projects/:project_id",
  authenticateToken,
  deleteProject as RequestHandler,
);

// Class routes
router.post(
  "/projects/:project_id/classes",
  authenticateToken,
  addClass as RequestHandler,
);
router.get(
  "/projects/:project_id/classes",
  authenticateToken,
  getClasses as RequestHandler,
);
router.get(
  "/projects/:project_id/classes/:class_id",
  authenticateToken,
  getClassById as RequestHandler,
);
router.put(
  "/projects/:project_id/classes/:class_id",
  authenticateToken,
  updateClass as RequestHandler,
);
router.delete(
  "/projects/:project_id/classes/:class_id",
  authenticateToken,
  deleteClass as RequestHandler,
);

// Image and Video routes
router.post(
  "/projects/:project_id/images",
  authenticateToken,
  upload.single("file"),
  uploadImage as RequestHandler,
);
router.get(
  "/projects/:project_id/images",
  authenticateToken,
  getImages as RequestHandler,
);
router.post(
  "/projects/:project_id/videos",
  authenticateToken,
  upload.single("file"),
  uploadVideo as RequestHandler,
);

// Annotation routes
router.post(
  "/images/:image_id/annotations",
  authenticateToken,
  addAnnotation as RequestHandler,
);
router.get(
  "/images/:image_id/annotations",
  authenticateToken,
  getAnnotations as RequestHandler,
);
router.get(
  "/images/:image_id/annotations/:annotation_id",
  authenticateToken,
  getAnnotationById as RequestHandler,
);
router.put(
  "/images/:image_id/annotations/:annotation_id",
  authenticateToken,
  updateAnnotation as RequestHandler,
);
router.delete(
  "/images/:image_id/annotations/:annotation_id",
  authenticateToken,
  deleteAnnotation as RequestHandler,
);

// Dataset routes
router.post(
  "/projects/:project_id/datasets",
  authenticateToken,
  createDataset as RequestHandler,
);
router.get(
  "/projects/:project_id/datasets",
  authenticateToken,
  getDatasets as RequestHandler,
);
router.get(
  "/datasets/:dataset_id",
  authenticateToken,
  getDatasetById as RequestHandler,
);
router.put(
  "/datasets/:dataset_id",
  authenticateToken,
  updateDataset as RequestHandler,
);
router.delete(
  "/datasets/:dataset_id",
  authenticateToken,
  deleteDataset as RequestHandler,
);
router.get(
  "/datasets/:dataset_id/images",
  authenticateToken,
  getDatasetImages as RequestHandler,
);
router.post(
  "/datasets/:dataset_id/images",
  authenticateToken,
  addImageToDataset as RequestHandler,
);
router.delete(
  "/datasets/:dataset_id/images/:image_id",
  authenticateToken,
  removeImageFromDataset as RequestHandler,
);
router.post(
  "/datasets/:dataset_id/generate",
  authenticateToken,
  generateDataset as RequestHandler,
);

export default router;
