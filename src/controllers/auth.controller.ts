import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwtHelper";
import { AppError } from "../middleware/errorHandler";
import { registerUser, findUserByEmailOrUsername } from "../models/auth.model";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { username, email, password } = req.body;

  // Validate request body
  if (!username || !email || !password) {
    return next(
      new AppError("Username, email, and password are required", 400),
    );
  }
  if (password.length < 6) {
    return next(
      new AppError("Password must be at least 6 characters long", 400),
    );
  }

  try {
    // Hash password (business logic kept here as it precedes DB operation)
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Delegate registration to model
    const userId = await registerUser(username, email, password_hash);

    // Generate token and send response
    const tokenPayload = { userId, email };
    const token = generateToken(tokenPayload);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { userId, username, email },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    console.error("Registration Error:", error);
    next(new AppError("Registration failed", 500));
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { identifier, password } = req.body;

  // Validate request body
  if (!identifier || !password) {
    return next(new AppError("Email/Username and password are required", 400));
  }

  try {
    // Delegate user lookup to model
    const user = await findUserByEmailOrUsername(identifier);

    if (!user) {
      return next(new AppError("Invalid credentials", 401));
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return next(new AppError("Invalid credentials", 401));
    }

    // Check if account is active
    if (!user.is_active) {
      return next(new AppError("Account is inactive", 403));
    }

    // Generate token and send response
    const tokenPayload = { userId: user.user_id, email: user.email };
    const token = generateToken(tokenPayload);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    next(new AppError("Login failed", 500));
  }
};
