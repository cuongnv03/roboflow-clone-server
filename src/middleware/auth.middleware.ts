import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwtHelper";
import { AppError } from "./errorHandler";
import { pool } from "../config/db";
import { UserDb } from "../types/express/index";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Not authorized, no token provided", 401));
  }

  try {
    const decoded = verifyToken(token) as JwtPayload;

    if (!decoded || typeof decoded.userId !== "number") {
      throw new AppError("Invalid token payload", 401);
    }

    const connection = await pool.getConnection();
    try {
      const query =
        "SELECT user_id, email, is_active FROM Users WHERE user_id = ? LIMIT 1";
      const [rows] = await connection.query<UserDb[]>(query, [decoded.userId]);

      if (rows.length === 0) {
        return next(
          new AppError(
            "The user belonging to this token no longer exists.",
            401,
          ),
        );
      }

      const currentUser = rows[0];

      if (!currentUser.is_active) {
        return next(new AppError("User account is inactive.", 403));
      }

      req.user = {
        userId: currentUser.user_id,
        email: currentUser.email,
      };

      next();
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(
        new AppError("Your token has expired! Please log in again.", 401),
      );
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    console.error("Authentication Middleware Error:", error);
    return next(new AppError("Not authorized.", 401));
  }
};
