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

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://roboflow-clone-client.vercel.app",
    "https://*.vercel.app", // Allow all vercel subdomains
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
  ],
  optionsSuccessStatus: 200,
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Roboflow Clone API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/projects", imageRoutes);
app.use("/api/v1/annotations", annotationRoutes);
app.use("/api/v1/datasets", datasetRoutes);

// Not found handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");

    // Sync models with database (only in development)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ force: false });
      console.log("✅ Database synced");
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `🚀 Server is running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`,
      );
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
