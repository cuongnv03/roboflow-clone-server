import { Request, Response, NextFunction } from "express";

// Type for async Express handlers
type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

// Wrapper to catch errors from async functions and pass them to Express error handler
export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
