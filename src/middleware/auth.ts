import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Assuming AuthRequest extends Request to include a user property
interface AuthRequest extends Request {
  user?: { user_id: number; username: string };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  // Extract token from Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // e.g., "Bearer <token>"

  // No token provided
  if (!token) {
    res.status(401).json({ error: "Access denied: No token provided" });
    return; // Stop execution after sending response
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    if (err) {
      // Invalid token
      res.status(403).json({ error: "Forbidden: Invalid token" });
      return; // Stop execution after sending response
    }

    // Token is valid, attach user to request and proceed
    req.user = user as { user_id: number; username: string };
    next();
  });
};
