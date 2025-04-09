import express from "express";
import { body } from "express-validator";
import * as userController from "../controllers/userController";
import { protect } from "../middleware/auth";

const router = express.Router();

// Register a new user
router.post(
  "/register",
  [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  userController.register,
);

// Login user
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  userController.login,
);

// Get user profile
router.get("/profile", protect, userController.getProfile);

// Update user profile
router.put(
  "/profile",
  protect,
  [
    body("username")
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  userController.updateProfile,
);

export default router;
