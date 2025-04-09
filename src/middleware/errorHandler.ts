import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError";

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again", 401);
const handleJWTExpiredError = () =>
  new AppError("Your token has expired. Please log in again", 401);
const handleDuplicateDBFieldError = (error: any) => {
  // Extract field name from error message
  const field = error.message.match(/key '(.+)'/)?.[1] || "field";
  return new AppError(
    `Duplicate value for ${field}. Please use another value`,
    400,
  );
};

const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  // Operational errors: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // Programming or unknown errors: don't leak error details
  else {
    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();
    if (err.code === "ER_DUP_ENTRY") error = handleDuplicateDBFieldError(err);

    sendErrorProd(error, res);
  }
};
