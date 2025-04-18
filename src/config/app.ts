import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: parseInt(process.env.JWT_EXPIRES_IN || "86400", 10),
};

export default config;
