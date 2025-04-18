import { Router } from 'express';
import { ProjectController } from '../controllers/ProjectController';
import { ClassController } from '../controllers/ClassController';
import { ProjectService } from '../../domain/services/ProjectService';
import { ClassService } from '../../domain/services/ClassService';
import { ProjectRepository } from '../../domain/repositories/ProjectRepository';
import { ClassRepository } from '../../domain/repositories/ClassRepository';
import { authMiddleware } from '../middlewares/auth';
import { createProjectValidator, updateProjectValidator } from '../validators/projectValidator';
import { createClassValidator, updateClassValidator } from '../validators/classValidator';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { AuthService } from '../../domain/services/AuthService';

const router = Router();

// Initialize repositories
const projectRepository = new ProjectRepository();
const classRepository = new ClassRepository();
const userRepository = new UserRepository();

// Initialize services
const authService = new AuthService(userRepository);
const projectService = new ProjectService(projectRepository);
const classService = new ClassService(classRepository, projectRepository);

// Initialize controllers
const projectController = new ProjectController(projectService);
const classController = new ClassController(classService);

// Middleware
const auth = authMiddleware(authService);

// Apply auth middleware to all routes
router.use(auth);

// Project routes
router.post('/', createProjectValidator, projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:projectId', projectController.getProject);
router.get('/:projectId/stats', projectController.getProjectStats);
router.put('/:projectId', updateProjectValidator, projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

// Class routes within projects
router.post('/:projectId/classes', createClassValidator, classController.createClass);
router.get('/:projectId/classes', classController.getProjectClasses);
router.put('/classes/:classId', updateClassValidator, classController.updateClass);
router.delete('/classes/:classId', classController.deleteClass);

export default router;