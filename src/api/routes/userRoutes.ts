import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { updateProfileValidator } from '../validators/authValidator';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { UserService } from '../../domain/services/UserService';
import { AuthService } from '../../domain/services/AuthService';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Middleware
const auth = authMiddleware(authService);

// Get user profile
router.get('/profile', auth, userController.getProfile);

// Update user profile
router.put(
  '/profile',
  auth,
  updateProfileValidator,
  userController.updateProfile
);

export default router;