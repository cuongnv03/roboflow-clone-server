export interface ModelConfigDTO {
  name: string;
  datasetId: number;
  architecture: "yolov5" | "yolov8" | "fasterrcnn" | "efficientdet";
  baseModel?: string; // e.g., 'yolov5s', 'yolov8n', etc.
  epochs: number;
  batchSize: number;
  learningRate: number;
  imageSize: number;
  advancedSettings?: Record<string, any>;
}

export interface ModelResponseDTO {
  id: number;
  name: string;
  projectId: number;
  datasetId: number;
  status: "pending" | "training" | "completed" | "failed";
  progress: number; // 0-100
  metrics?: {
    mAP?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
  };
  createdAt: string;
  completedAt?: string;
  configuration: ModelConfigDTO;
}
