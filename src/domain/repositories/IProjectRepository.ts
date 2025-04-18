import Project, {
  ProjectCreationAttributes,
} from "../../database/models/Project";
import { ProjectStatsDTO } from "../dtos/project.dto";

export interface IProjectRepository {
  create(
    userId: number,
    projectData: Omit<ProjectCreationAttributes, "user_id">,
  ): Promise<Project>;
  findById(projectId: number): Promise<Project>;
  findByUserId(userId: number): Promise<Project[]>;
  update(
    projectId: number,
    data: Partial<Omit<ProjectCreationAttributes, "user_id">>,
  ): Promise<Project>;
  delete(projectId: number): Promise<void>;
  getProjectStats(projectId: number): Promise<ProjectStatsDTO>;
  verifyOwnership(projectId: number, userId: number): Promise<boolean>;
}
