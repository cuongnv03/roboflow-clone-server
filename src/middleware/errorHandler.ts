import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import multer from "multer";

// Custom Error class to include status codes
class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler: ErrorRequestHandler = (
  err,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer Error:", err);
    res.status(400).json({
      success: false,
      status: 400,
      message: `File upload error: ${err.message} (${err.field})`,
    });
    return next();
  }

  console.error("Error:", err.stack || err.message || err);

  let statusCode =
    err instanceof AppError && err.statusCode ? err.statusCode : 500;
  if (res.statusCode && res.statusCode !== 200) {
    statusCode = res.statusCode;
  }

  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
  next();
};

export { errorHandler, AppError };
