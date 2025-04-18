import { IProjectService } from "../interfaces/IProjectService";
import { IProjectRepository } from "../interfaces/IProjectRepository";
import {
  ProjectCreateDTO,
  ProjectResponseDTO,
  ProjectUpdateDTO,
  ProjectStatsDTO,
} from "../dtos/project.dto";
import Project from "../../database/models/Project";

export class ProjectService implements IProjectService {
  constructor(private projectRepository: IProjectRepository) {}

  async createProject(
    userId: number,
    projectData: ProjectCreateDTO,
  ): Promise<ProjectResponseDTO> {
    const project = await this.projectRepository.create(userId, projectData);
    return this.mapToProjectResponseDTO(project);
  }

  async getAllProjects(userId: number): Promise<ProjectResponseDTO[]> {
    const projects = await this.projectRepository.findByUserId(userId);
    return projects.map((project) => this.mapToProjectResponseDTO(project));
  }

  async getProject(
    projectId: number,
    userId: number,
  ): Promise<ProjectResponseDTO> {
    // Verify ownership
    await this.projectRepository.verifyOwnership(projectId, userId);
    const project = await this.projectRepository.findById(projectId);
    return this.mapToProjectResponseDTO(project);
  }

  async updateProject(
    projectId: number,
    userId: number,
    data: ProjectUpdateDTO,
  ): Promise<ProjectResponseDTO> {
    // Verify ownership is checked in repository
    const project = await this.projectRepository.update(projectId, data);
    return this.mapToProjectResponseDTO(project);
  }

  async deleteProject(projectId: number, userId: number): Promise<void> {
    // Verify ownership
    await this.projectRepository.verifyOwnership(projectId, userId);
    await this.projectRepository.delete(projectId);
  }

  async getProjectStats(
    projectId: number,
    userId: number,
  ): Promise<ProjectStatsDTO> {
    // Verify ownership
    await this.projectRepository.verifyOwnership(projectId, userId);
    return this.projectRepository.getProjectStats(projectId);
  }

  // Helper method to map Project model to DTO
  private mapToProjectResponseDTO(project: Project): ProjectResponseDTO {
    return {
      id: project.project_id,
      name: project.name,
      description: project.description || undefined,
      type: project.type,
      userId: project.user_id,
      createdAt: project.created_at.toISOString(),
      updatedAt: project.updated_at.toISOString(),
    };
  }
}
