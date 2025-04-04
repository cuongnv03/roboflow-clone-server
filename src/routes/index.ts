import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import projectRouter from "./project.routes"; // Import the top-level project router
import { protect } from "../middleware/auth.middleware";

const mainRouter = Router();

// --- Health Check Route ---
mainRouter.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Roboflow Clone API is running!",
    timestamp: new Date().toISOString(),
    status: "OK",
  });
});

// --- Authentication Routes (Public) ---
mainRouter.use("/auth", authRoutes);

// --- Protected Routes Example ---
mainRouter.get("/users/me", protect, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
  res.status(200).json({ success: true, user: req.user });
});

// --- Project Routes (Protected) ---
// All project-related routes (including nested images, classes, datasets, annotations)
// are now under /projects and require authentication.
mainRouter.use("/projects", protect, projectRouter);

export default mainRouter;
