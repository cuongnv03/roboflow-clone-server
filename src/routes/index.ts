import express, { RequestHandler } from "express";
import { authenticateToken } from "../middleware/auth";
import { registerUser, loginUser } from "../controllers/userController";
import {
  createWorkspace,
  getWorkspaces,
} from "../controllers/workspaceController";
import { createProject, getProjects } from "../controllers/projectController";
import { addClass, getClasses } from "../controllers/classController";
import { uploadImage, getImages } from "../controllers/imageController";
import {
  addAnnotation,
  getAnnotations,
} from "../controllers/annotationController";
import {
  createDataset,
  getDatasets,
  getDatasetDetails,
} from "../controllers/datasetController";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// User routes
router.post("/users/register", registerUser as RequestHandler);
router.post("/users/login", loginUser as RequestHandler);

// Workspace routes
router.post(
  "/workspaces",
  authenticateToken,
  createWorkspace as RequestHandler,
);
router.get("/workspaces", authenticateToken, getWorkspaces as RequestHandler);

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

// Image routes
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

// Annotation routes
router.post(
  "/projects/:project_id/images/:image_id/annotations",
  authenticateToken,
  addAnnotation as RequestHandler,
);
router.get(
  "/projects/:project_id/images/:image_id/annotations",
  authenticateToken,
  getAnnotations as RequestHandler,
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
  "/projects/:project_id/datasets/:dataset_id",
  authenticateToken,
  getDatasetDetails as RequestHandler,
);

export default router;
