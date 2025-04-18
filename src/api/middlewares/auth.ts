import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../domain/services/AuthService";
import { AuthenticationError } from "../../exceptions/AuthenticationError";
import { UserTokenPayload } from "../../database/models/User";

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
    }
  }
}

export const authMiddleware = (authService: AuthService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AuthenticationError("Not authorized. Please log in");
      }

      const token = authHeader.split(" ")[1];
      const decodedToken = authService.verifyToken(token);

      req.user = decodedToken;
      next();
    } catch (error) {
      next(error);
    }
  };
};
