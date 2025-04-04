import jwt from "jsonwebtoken";
import "../config/dotenv";
import { AppError } from "../middleware/errorHandler";

const JWT_SECRET_ENV = process.env.JWT_SECRET;
// Default to 1 day in seconds (24 * 60 * 60 = 86400) if env var is missing/invalid
const JWT_EXPIRES_IN_SECONDS = parseInt(
  process.env.JWT_EXPIRES_IN || "86400",
  10,
);

if (!JWT_SECRET_ENV) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
  process.exit(1);
}
if (isNaN(JWT_EXPIRES_IN_SECONDS) || JWT_EXPIRES_IN_SECONDS <= 0) {
  console.warn(`Invalid JWT_EXPIRES_IN value, using default of 86400 seconds.`);
  // Use default if parsing failed or value is non-positive
  // JWT_EXPIRES_IN_SECONDS = 86400; // Already handled by the || '86400' default in initial assignment
}

/**
 * Generates a JWT token.
 * @param payload - The data to include in the token payload (e.g., user ID).
 * @returns The generated JWT token.
 */
export const generateToken = (payload: object): string => {
  const secret: jwt.Secret = JWT_SECRET_ENV;
  // Use the numeric seconds value for expiresIn
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN_SECONDS };

  return jwt.sign(payload, secret, options);
};

/**
 * Verifies a JWT token.
 * @param token - The JWT token to verify.
 * @returns The decoded payload if the token is valid.
 * @throws {JsonWebTokenError | Error} If the token is invalid or expired.
 */
export const verifyToken = (token: string): string | jwt.JwtPayload => {
  try {
    const secret: jwt.Secret = JWT_SECRET_ENV;
    return jwt.verify(token, secret);
  } catch (error) {
    console.error("JWT Verification Error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(`Token error: ${error.message}`, 401);
    }
    throw new AppError("Failed to verify token", 500);
  }
};
