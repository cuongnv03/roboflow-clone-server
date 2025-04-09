export type ProjectType =
  | "object_detection"
  | "classification"
  | "instance_segmentation"
  | "keypoint_detection"
  | "multimodal";

export interface Project {
  project_id: number;
  user_id: number;
  name: string;
  description: string | null;
  type: ProjectType;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectInput {
  name: string;
  description?: string;
  type: ProjectType;
}

export interface ProjectClass {
  class_id: number;
  project_id: number;
  name: string;
  color: string;
  created_at: Date;
}

export interface ClassInput {
  name: string;
  color?: string;
}
