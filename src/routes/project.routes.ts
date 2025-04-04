import { Router } from "express";
import {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/project.controller";
import imageRouter from "./image.routes";
import classRouter from "./class.routes";
import datasetRouter from "./dataset.routes";

const projectRouter = Router(); // Top-level router for projects

// POST /api/v1/projects - Create a new project
projectRouter.post("/", createProject);

// GET /api/v1/projects - Get projects owned by the logged-in user
projectRouter.get("/", getMyProjects);

// GET /api/v1/projects/:projectId - Get a specific project by ID
projectRouter.get("/:projectId", getProjectById);

// PUT /api/v1/projects/:projectId - Update a specific project
projectRouter.put("/:projectId", updateProject);

// DELETE /api/v1/projects/:projectId - Delete a specific project
projectRouter.delete("/:projectId", deleteProject);

// --- Mount Nested Routes ---
// Note: These routers use mergeParams: true internally

// Mount Image Routes (includes nested annotation routes)
// URL: /api/v1/projects/:projectId/images...
projectRouter.use("/:projectId/images", imageRouter);

// Mount Class Routes
// URL: /api/v1/projects/:projectId/classes...
projectRouter.use("/:projectId/classes", classRouter);

// Mount Dataset Routes
// URL: /api/v1/projects/:projectId/datasets...
projectRouter.use("/:projectId/datasets", datasetRouter);

export default projectRouter;
