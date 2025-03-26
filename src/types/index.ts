export interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Workspace {
  workspace_id: number;
  name: string;
  owner_id: number;
  created_at: string;
  description?: string;
}

export interface Project {
  project_id: number;
  workspace_id: number;
  name: string;
  description?: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  class_id: number;
  project_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Image {
  image_id: number;
  project_id: number;
  file_path: string;
  original_filename: string;
  width: number;
  height: number;
  upload_date: string;
  uploaded_by: number;
  status: string;
}

export interface Annotation {
  annotation_id: number;
  image_id: number;
  class_id: number;
  annotation_data: any;
  created_at: string;
  created_by: number;
  is_valid: boolean;
}

export interface Dataset {
  dataset_id: number;
  project_id: number;
  name: string;
  created_date: string;
  preprocessing_settings?: any;
  augmentation_settings?: any;
  status: string;
}

export interface DatasetImage {
  dataset_id: number;
  image_id: number;
  split: string;
}
