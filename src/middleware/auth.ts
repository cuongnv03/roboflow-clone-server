import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError";
import config from "../config/app";
import { JwtPayload } from "../types/user.types";

// Extend the Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1) Get token
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in. Please log in to get access", 401),
      );
    }

    // 2) Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // 3) Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError("Invalid token or user no longer exists", 401));
  }
};
