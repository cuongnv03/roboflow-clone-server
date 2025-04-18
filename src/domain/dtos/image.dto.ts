import { ImageStatus } from "../../database/models/Image";

export interface ImageResponseDTO {
  id: number;
  projectId: number;
  filePath: string;
  originalFilename: string;
  width: number;
  height: number;
  uploadDate: string;
  status: ImageStatus;
  batchName?: string;
}

export interface ImageUploadOptionsDTO {
  resize?: { width: number; height: number };
  autoOrient?: boolean;
  format?: "jpeg" | "png" | "webp";
  batchName?: string;
}

export interface ImageStatusUpdateDTO {
  status: ImageStatus;
}

export interface BatchUploadResultDTO {
  uploadedImages: ImageResponseDTO[];
  failedUploads: Array<{ filename: string; error: string }>;
  totalUploaded: number;
  totalFailed: number;
}
