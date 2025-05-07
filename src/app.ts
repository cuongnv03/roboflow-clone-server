import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import sequelize from "./config/database";

// Import routes
import authRoutes from "./api/routes/authRoutes";
import userRoutes from "./api/routes/userRoutes";
import projectRoutes from "./api/routes/projectRoutes";
import imageRoutes from "./api/routes/imageRoutes";
import annotationRoutes from "./api/routes/annotationRoutes";
import datasetRoutes from "./api/routes/datasetRoutes";

// Import middlewares
import { errorHandler } from "./api/middlewares/errorHandler";
import { notFoundHandler } from "./api/middlewares/notFoundHandler";

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/projects", imageRoutes);
app.use("/api/v1/annotations", annotationRoutes);
app.use("/api/v1/datasets", datasetRoutes);

// Home route
app.get("/", (req, res) => {
  res.send("Roboflow Clone API is running");
});

// Not found handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("Database connection established successfully");

    // Sync models with database (only in development)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ force: false });
      console.log("Database synced");
    }

    app.listen(PORT, () => {
      console.log(
        `Server is running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`,
      );
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
