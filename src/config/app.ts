import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "fallback_secret_key_for_dev",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "86400",
};

export default config;
