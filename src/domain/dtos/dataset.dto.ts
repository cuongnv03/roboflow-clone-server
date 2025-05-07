import { DatasetSplit } from "../../database/models/DatasetImage";
import { DatasetStatus } from "../../database/models/Dataset";

export interface DatasetCreateDTO {
  name: string;
  projectId: number;
  splitRatio?: {
    train: number;
    valid: number;
    test: number;
  };
  preprocessing?: {
    resize?: { width: number; height: number };
    autoOrient?: boolean;
    normalize?: boolean;
    grayscale?: boolean;
  };
  augmentation?: {
    enabled: boolean;
    rotation?: { min: number; max: number };
    flip?: { horizontal: boolean; vertical: boolean };
    brightness?: { min: number; max: number };
    contrast?: { min: number; max: number };
    noise?: boolean;
  };
  includeAnnotated?: boolean;
  includeUnlabeled?: boolean;
  filterByBatch?: string[];
}

export interface DatasetResponseDTO {
  id: number;
  projectId: number;
  name: string;
  status: DatasetStatus;
  createdDate: string;
  preprocessing: any;
  augmentation: any;
  imageCount: {
    train: number;
    valid: number;
    test: number;
    total: number;
  };
}

export interface DatasetImageAssignDTO {
  imageIds: number[];
  split: DatasetSplit;
}

export interface DatasetSplitDTO {
  strategy: "random" | "manual";
  ratio?: {
    train: number;
    valid: number;
    test: number;
  };
  manualAssignments?: Array<{
    imageId: number;
    split: DatasetSplit;
  }>;
}

export interface DatasetExportOptionsDTO {
  format: "coco" | "yolo" | "pascal_voc" | "createml" | "tensorflow";
  includeImages: boolean;
  exportSplits: DatasetSplit[];
  includeOriginals?: boolean;
  includeAugmented?: boolean;
}

export interface DatasetExportResultDTO {
  downloadUrl: string;
  format: string;
  imageCount: number;
  annotationCount: number;
  exportedAt: string;
  expiresAt?: string;
}
