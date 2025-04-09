import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { ProjectModel } from "../models/projectModel";
import { ClassModel } from "../models/classModel";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse, errorResponse } from "../utils/responseFormatter";
import AppError from "../utils/appError";

export const createProject = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, "Validation error", 400, errors.array());
    }

    const project = await ProjectModel.create(req.user.id, req.body);
    return successResponse(res, project, 201, "Project created successfully");
  },
);

export const getAllProjects = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    const projects = await ProjectModel.findByUserId(req.user.id);
    return successResponse(
      res,
      projects,
      200,
      "Projects retrieved successfully",
    );
  },
);

export const getProject = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    const projectId = Number(req.params.projectId);

    // Verify project belongs to user
    await ProjectModel.verifyProjectOwnership(projectId, req.user.id);

    const project = await ProjectModel.findById(projectId);
    return successResponse(res, project, 200, "Project retrieved successfully");
  },
);

export const updateProject = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, "Validation error", 400, errors.array());
    }

    const projectId = Number(req.params.projectId);
    const updatedProject = await ProjectModel.update(
      projectId,
      req.user.id,
      req.body,
    );

    return successResponse(
      res,
      updatedProject,
      200,
      "Project updated successfully",
    );
  },
);

export const deleteProject = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    const projectId = Number(req.params.projectId);
    await ProjectModel.delete(projectId, req.user.id);

    return successResponse(res, null, 200, "Project deleted successfully");
  },
);

export const getProjectStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    const projectId = Number(req.params.projectId);

    // Verify project belongs to user
    await ProjectModel.verifyProjectOwnership(projectId, req.user.id);

    const stats = await ProjectModel.getProjectStats(projectId);
    return successResponse(
      res,
      stats,
      200,
      "Project statistics retrieved successfully",
    );
  },
);

// Class management within projects
export const createClass = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, "Validation error", 400, errors.array());
    }

    const projectId = Number(req.params.projectId);
    const projectClass = await ClassModel.create(
      projectId,
      req.user.id,
      req.body,
    );

    return successResponse(
      res,
      projectClass,
      201,
      "Class created successfully",
    );
  },
);

export const getProjectClasses = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    const projectId = Number(req.params.projectId);

    // Verify project belongs to user
    await ProjectModel.verifyProjectOwnership(projectId, req.user.id);

    const classes = await ClassModel.findByProjectId(projectId);
    return successResponse(
      res,
      classes,
      200,
      "Project classes retrieved successfully",
    );
  },
);

export const updateClass = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, "Validation error", 400, errors.array());
    }

    const classId = Number(req.params.classId);
    const updatedClass = await ClassModel.update(
      classId,
      req.user.id,
      req.body,
    );

    return successResponse(
      res,
      updatedClass,
      200,
      "Class updated successfully",
    );
  },
);

export const deleteClass = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    const classId = Number(req.params.classId);
    await ClassModel.delete(classId, req.user.id);

    return successResponse(res, null, 200, "Class deleted successfully");
  },
);
