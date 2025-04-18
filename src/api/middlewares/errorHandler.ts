import { Request, Response, NextFunction } from "express";
import { BaseError } from "../../exceptions/BaseError";
import { ValidationError } from "../../exceptions/ValidationError";
import { Sequelize } from "sequelize";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);

  // If it's our custom error
  if (err instanceof BaseError) {
    const response: any = {
      status: "error",
      message: err.message,
    };

    // Add validation errors if available
    if (err instanceof ValidationError && err.errors.length > 0) {
      response.errors = err.errors;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === "development") {
      response.stack = err.stack;
    }

    return res.status(err.statusCode).json(response);
  }

  // If JWT error
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: "error",
      message: "Invalid token. Please log in again.",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "error",
      message: "Your token has expired. Please log in again.",
    });
  }

  // For sequelize validation errors
  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    const errors = (err as any).errors.map((e: any) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      status: "error",
      message: "Validation error",
      errors,
    });
  }

  // Default server error
  return res.status(500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
