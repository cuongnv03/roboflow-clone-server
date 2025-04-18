import { Request, Response } from "express";
import { IProjectService } from "../../domain/services/IProjectService";
import {
  ProjectCreateDTO,
  ProjectUpdateDTO,
} from "../../domain/dtos/project.dto";
import { asyncHandler } from "../middlewares/asyncHandler";

export class ProjectController {
  constructor(private projectService: IProjectService) {}

  createProject = asyncHandler(async (req: Request, res: Response) => {
    const projectData: ProjectCreateDTO = req.body;
    const project = await this.projectService.createProject(
      req.user.id,
      projectData,
    );

    res.status(201).json({
      status: "success",
      message: "Project created successfully",
      data: project,
    });
  });

  getAllProjects = asyncHandler(async (req: Request, res: Response) => {
    const projects = await this.projectService.getAllProjects(req.user.id);

    res.status(200).json({
      status: "success",
      message: "Projects retrieved successfully",
      data: projects,
    });
  });

  getProject = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const project = await this.projectService.getProject(
      projectId,
      req.user.id,
    );

    res.status(200).json({
      status: "success",
      message: "Project retrieved successfully",
      data: project,
    });
  });

  updateProject = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const updateData: ProjectUpdateDTO = req.body;
    const updatedProject = await this.projectService.updateProject(
      projectId,
      req.user.id,
      updateData,
    );

    res.status(200).json({
      status: "success",
      message: "Project updated successfully",
      data: updatedProject,
    });
  });

  deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    await this.projectService.deleteProject(projectId, req.user.id);

    res.status(200).json({
      status: "success",
      message: "Project deleted successfully",
      data: null,
    });
  });

  getProjectStats = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const stats = await this.projectService.getProjectStats(
      projectId,
      req.user.id,
    );

    res.status(200).json({
      status: "success",
      message: "Project statistics retrieved successfully",
      data: stats,
    });
  });
}
