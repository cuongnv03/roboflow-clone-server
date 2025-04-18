import {
  ProjectCreateDTO,
  ProjectResponseDTO,
  ProjectUpdateDTO,
  ProjectStatsDTO,
} from "../dtos/project.dto";

export interface IProjectService {
  createProject(
    userId: number,
    projectData: ProjectCreateDTO,
  ): Promise<ProjectResponseDTO>;
  getAllProjects(userId: number): Promise<ProjectResponseDTO[]>;
  getProject(projectId: number, userId: number): Promise<ProjectResponseDTO>;
  updateProject(
    projectId: number,
    userId: number,
    data: ProjectUpdateDTO,
  ): Promise<ProjectResponseDTO>;
  deleteProject(projectId: number, userId: number): Promise<void>;
  getProjectStats(projectId: number, userId: number): Promise<ProjectStatsDTO>;
}
