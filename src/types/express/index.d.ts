import type { RowDataPacket } from "mysql2";
import type { File } from "multer";
import type {
  ProjectType as ImportedProjectType,
  SplitType as ImportedSplitType,
  ImageStatus as ImportedImageStatus,
  DatasetStatus as ImportedDatasetStatus,
} from "../projectTypes";

// Define the structure of the user object we'll attach to the request
interface AuthenticatedUser {
  userId: number;
  email: string;
}

// Extend the Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }
  }
}

// Define the full User structure matching the DB
export interface UserDb extends RowDataPacket {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// Define the Project structure matching the DB
export interface ProjectDb extends RowDataPacket {
  project_id: number;
  user_id: number;
  name: string;
  description: string | null;
  type: ImportedProjectType; // Use imported type
  created_at: Date;
  updated_at: Date;
}

// Define the Image structure matching the DB
export interface ImageDb extends RowDataPacket {
  image_id: number;
  project_id: number;
  file_path: string;
  original_filename: string;
  width: number;
  height: number;
  upload_date: Date;
  status: ImportedImageStatus; // Use imported type
}

// Define the Class structure matching the DB
export interface ClassDb extends RowDataPacket {
  class_id: number;
  project_id: number;
  name: string;
  color: string | null;
  created_at: Date;
}

// Define the Annotation structure matching the DB
export interface AnnotationDb extends RowDataPacket {
  annotation_id: number;
  image_id: number;
  class_id: number;
  annotation_data: any; // JSON type
  created_at: Date;
  is_valid: boolean;
  // Optional joined fields
  class_name?: string;
  class_color?: string;
}

// Define the Dataset structure matching the DB
export interface DatasetDb extends RowDataPacket {
  dataset_id: number;
  project_id: number;
  name: string;
  created_date: Date;
  preprocessing_settings: any | null; // JSON
  augmentation_settings: any | null; // JSON
  status: ImportedDatasetStatus; // Use imported type
}

// Define the DatasetImage structure matching the DB
export interface DatasetImageDb extends RowDataPacket {
  dataset_id: number;
  image_id: number;
  split: ImportedSplitType; // Use imported type
  // Optional joined fields
  file_path?: string;
  original_filename?: string;
}

// Re-export types defined in projectTypes.ts if they are needed elsewhere via this file
// (Alternatively, import directly from projectTypes.ts where needed)
export type ProjectType = ImportedProjectType;
export type SplitType = ImportedSplitType;
export type ImageStatus = ImportedImageStatus;
export type DatasetStatus = ImportedDatasetStatus;
