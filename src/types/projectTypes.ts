// Contains runtime constants and related types previously in index.d.ts
// -----------------------------------------------------------------------------
// Define allowed Project Types based on ENUM in schema
export type ProjectType =
  | "object_detection"
  | "classification"
  | "instance_segmentation"
  | "keypoint_detection"
  | "multimodal";

// Helper array for validation (RUNTIME VALUE)
export const allowedProjectTypes: ProjectType[] = [
  "object_detection",
  "classification",
  "instance_segmentation",
  "keypoint_detection",
  "multimodal",
];
