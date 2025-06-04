import { IProjectService } from "../IProjectService";
import { IProjectRepository } from "../../repositories/IProjectRepository";
import {
  ProjectCreateDTO,
  ProjectResponseDTO,
  ProjectUpdateDTO,
  ProjectStatsDTO,
} from "../../dtos/project.dto";
import Project from "../../../database/models/Project";
import { LocalStorageProvider } from "../../../infrastructure/storage/providers/LocalStorageProvider";
import { IImageRepository } from "../../repositories/IImageRepository";
import { getErrorMessage } from "../../../utils/errorHandling";
export class ProjectService implements IProjectService {
  constructor(
    private projectRepository: IProjectRepository,
    private imageRepository: IImageRepository,
    private storageProvider: LocalStorageProvider,
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

    try {
      // Lấy đường dẫn thư mục project
      const projectDir = this.storageProvider.getProjectDirectory(projectId);
      // Xóa thư mục project và tất cả nội dung bên trong
      await this.storageProvider.deleteDirectory(projectDir);
      console.log(
        `Successfully deleted project directory for project ${projectId}`,
      );
    } catch (error) {
      console.error(
        `Error deleting project directory: ${getErrorMessage(error)}`,
      );
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
