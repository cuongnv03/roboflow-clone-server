import { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/errorHandler";
import {
  handleCreateProject,
  getProjectsByUserId,
  getProjectByIdForUser,
  handleUpdateProject,
  handleDeleteProject,
} from "../models/project.model";
import { allowedProjectTypes } from "../types/projectTypes";
import type { ProjectDb } from "../types/express/index.d";

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { name, description, type } = req.body;
  const userId = req.user?.userId;

  // Validate authentication
  if (!userId) {
    return next(new AppError("Authentication error: User ID not found", 401));
  }

  // Validate request body
  if (!name || !type) {
    return next(new AppError("Project name and type are required", 400));
  }
  if (!allowedProjectTypes.includes(type)) {
    return next(
      new AppError(
        `Invalid project type. Allowed types are: ${allowedProjectTypes.join(
          ", ",
        )}`,
        400,
      ),
    );
  }

  try {
    // Delegate project creation to model
    const projectId = await handleCreateProject(
      userId,
      name,
      description,
      type,
    );
    const project = await getProjectByIdForUser(projectId, userId);
    if (!project) {
      throw new AppError("Failed to retrieve created project", 500);
    }

    // Send response
    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProjects = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;

  // Validate authentication
  if (!userId) {
    return next(new AppError("Authentication error: User ID not found", 401));
  }

  try {
    // Delegate project retrieval to model
    const projects = await getProjectsByUserId(userId);

    // Send response
    res.status(200).json({ success: true, count: projects.length, projects });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { projectId } = req.params;
  const userId = req.user?.userId;

  // Validate authentication
  if (!userId) {
    return next(new AppError("Authentication error: User ID not found", 401));
  }

  // Validate request parameters
  if (!projectId || isNaN(parseInt(projectId, 10))) {
    return next(new AppError("Invalid project ID provided", 400));
  }

  const numericProjectId = parseInt(projectId, 10);
  try {
    // Delegate project retrieval to model
    const project = await getProjectByIdForUser(numericProjectId, userId);
    if (!project) {
      return next(new AppError("Project not found or not authorized", 404));
    }

    // Send response
    res.status(200).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { projectId } = req.params;
  const { name, description } = req.body;
  const userId = req.user?.userId;

  // Validate authentication
  if (!userId) {
    return next(new AppError("Authentication error: User ID not found", 401));
  }

  // Validate request parameters and body
  if (!projectId || isNaN(parseInt(projectId, 10))) {
    return next(new AppError("Invalid project ID provided", 400));
  }
  if (!name && description === undefined) {
    return next(
      new AppError("No update data provided (name or description)", 400),
    );
  }

  const numericProjectId = parseInt(projectId, 10);
  const updates: Partial<ProjectDb> = {};
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;

  try {
    // Delegate project update to model
    await handleUpdateProject(numericProjectId, userId, updates);
    const updatedProject = await getProjectByIdForUser(
      numericProjectId,
      userId,
    );
    if (!updatedProject) {
      throw new AppError("Failed to retrieve updated project", 500);
    }

    // Send response
    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { projectId } = req.params;
  const userId = req.user?.userId;

  // Validate authentication
  if (!userId) {
    return next(new AppError("Authentication error: User ID not found", 401));
  }

  // Validate request parameters
  if (!projectId || isNaN(parseInt(projectId, 10))) {
    return next(new AppError("Invalid project ID provided", 400));
  }

  const numericProjectId = parseInt(projectId, 10);
  try {
    // Delegate project deletion to model
    await handleDeleteProject(numericProjectId, userId);

    // Send response
    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
