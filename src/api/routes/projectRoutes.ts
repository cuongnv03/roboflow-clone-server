import { Router } from "express";
import { ProjectController } from "../controllers/ProjectController";
import { ClassController } from "../controllers/ClassController";
import { ProjectService } from "../../domain/services/impl/ProjectService";
import { ClassService } from "../../domain/services/impl/ClassService";
import { ProjectRepository } from "../../domain/repositories/impl/ProjectRepository";
import { ClassRepository } from "../../domain/repositories/impl/ClassRepository";
import { authMiddleware } from "../middlewares/auth";
import {
  createProjectValidator,
  updateProjectValidator,
} from "../validators/projectValidator";
import {
  createClassValidator,
  updateClassValidator,
} from "../validators/classValidator";
import { UserRepository } from "../../domain/repositories/impl/UserRepository";
import { AuthService } from "../../domain/services/impl/AuthService";
import { StorageFactory } from "../../infrastructure/storage/StorageFactory";
import { ImageRepository } from "../../domain/repositories/impl/ImageRepository";

const router = Router();

// Initialize repositories
const projectRepository = new ProjectRepository();
const imageRepository = new ImageRepository();
const storageProvider = StorageFactory.createProvider("local");
const classRepository = new ClassRepository();
const userRepository = new UserRepository();

// Initialize services
const authService = new AuthService(userRepository);
const projectService = new ProjectService(
  projectRepository,
  imageRepository,
  storageProvider,
);
const classService = new ClassService(classRepository, projectRepository);

// Initialize controllers
const projectController = new ProjectController(projectService);
const classController = new ClassController(classService);

// Middleware
const auth = authMiddleware(authService);

// Apply auth middleware to all routes
router.use(auth);

// Project routes
router.post("/", createProjectValidator, projectController.createProject);
router.get("/", projectController.getAllProjects);
router.get("/:projectId", projectController.getProject);
router.get("/:projectId/stats", projectController.getProjectStats);
router.put(
  "/:projectId",
  updateProjectValidator,
  projectController.updateProject,
);
router.delete("/:projectId", projectController.deleteProject);

// Class routes within projects
router.post(
  "/:projectId/classes",
  createClassValidator,
  classController.createClass,
);
router.get("/:projectId/classes", classController.getProjectClasses);
router.put(
  "/classes/:classId",
  updateClassValidator,
  classController.updateClass,
);
router.delete("/classes/:classId", classController.deleteClass);

export default router;
