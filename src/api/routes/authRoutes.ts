import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { registerValidator, loginValidator } from "../validators/authValidator";
import { UserRepository } from "../../domain/repositories/impl/UserRepository";
import { AuthService } from "../../domain/services/impl/AuthService";

const router = Router();
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

router.post("/register", registerValidator, authController.register);
router.post("/login", loginValidator, authController.login);

export default router;
