import { IProjectService } from "../IProjectService";
import { IProjectRepository } from "../../repositories/IProjectRepository";
import {
  ProjectCreateDTO,
  ProjectResponseDTO,
  ProjectUpdateDTO,
  ProjectStatsDTO,
} from "../../dtos/project.dto";
import Project from "../../../database/models/Project";
import { IImageRepository } from "../../repositories/IImageRepository";
import { getErrorMessage } from "../../../utils/errorHandling";
import { S3StorageProvider } from "../../../infrastructure/storage/providers/S3StorageProvider";
import { LocalStorageProvider } from "../../../infrastructure/storage/providers/LocalStorageProvider";
import { IStorageProvider } from "../../../infrastructure/storage/interfaces/IStorageProvider";
export class ProjectService implements IProjectService {
  constructor(
    private projectRepository: IProjectRepository,
    private imageRepository: IImageRepository,
    private storageProvider: IStorageProvider,
  ) {}

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
    const images = await this.imageRepository.findByProjectId(projectId);
    await this.projectRepository.delete(projectId);
    for (const image of images) {
      try {
        await this.storageProvider.deleteFile(image.file_path);
      } catch (error) {
        console.error(`Failed to delete file: ${image.file_path}`, error);
      }
    }

    // If using S3, also delete the entire project directory
    if (this.storageProvider instanceof S3StorageProvider) {
      try {
        const projectDir = this.storageProvider.getProjectDirectory(projectId);
        await this.storageProvider.deleteDirectory(projectDir);
        console.log(
          `Successfully deleted S3 directory for project ${projectId}`,
        );
      } catch (error) {
        console.error(`Error deleting S3 project directory: ${error}`);
      }
    }
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
