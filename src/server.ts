import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Routes
import userRoutes from "./routes/userRoutes";
import projectRoutes from "./routes/projectRoutes";

// Error handler
import errorHandler from "./middleware/errorHandler";

// Database connection
import { testConnection } from "./config/database";

// App config
import config from "./config/app";

// Initialize app
const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/projects", projectRoutes);

// Home route
app.get("/", (req: Request, res: Response) => {
  res.send("Roboflow Clone API is running");
});

// Not found handler
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: "error",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
