import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { UserModel } from "../models/userModel";
import { UserInput } from "../types/user.types";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse, errorResponse } from "../utils/responseFormatter";
import AppError from "../utils/appError";

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, "Validation error", 400, errors.array());
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(req.body.email);
    if (existingUser) {
      return next(new AppError("User with this email already exists", 400));
    }

    // Create new user
    const userData: UserInput = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    };

    const user = await UserModel.create(userData);
    const token = UserModel.generateToken(user);

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    return successResponse(
      res,
      { user: userWithoutPassword, token },
      201,
      "User registered successfully",
    );
  },
);

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Check if user exists
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Check if password is correct
    const isPasswordValid = await UserModel.comparePassword(
      password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Generate token
    const token = UserModel.generateToken(user);

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    return successResponse(
      res,
      { user: userWithoutPassword, token },
      200,
      "Login successful",
    );
  },
);

export const getProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    return successResponse(
      res,
      userWithoutPassword,
      200,
      "User profile retrieved successfully",
    );
  },
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, "Validation error", 400, errors.array());
    }

    // Update user
    const updatedUser = await UserModel.update(req.user.id, req.body);

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = updatedUser;

    return successResponse(
      res,
      userWithoutPassword,
      200,
      "User profile updated successfully",
    );
  },
);
