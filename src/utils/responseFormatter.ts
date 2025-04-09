import { Response } from "express";

/**
 * Standard success response format
 */
export const successResponse = (
  res: Response,
  data: any,
  statusCode = 200,
  message = "Success",
) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

/**
 * Standard error response format
 */
export const errorResponse = (
  res: Response,
  message = "An error occurred",
  statusCode = 400,
  errors: any = null,
) => {
  return res.status(statusCode).json({
    status: "error",
    message,
    errors,
  });
};
