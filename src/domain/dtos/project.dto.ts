import { ProjectType } from "../../database/models/Project";

export interface ProjectCreateDTO {
  name: string;
  description?: string;
  type: ProjectType;
}

export interface ProjectResponseDTO {
  id: number;
  name: string;
  description?: string;
  type: ProjectType;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectUpdateDTO {
  name?: string;
  description?: string;
  type?: ProjectType;
}

export interface ProjectStatsDTO {
  totalImages: number;
  annotatedImages: number;
  totalAnnotations: number;
  classDistribution: Array<{
    name: string;
    count: number;
  }>;
}
