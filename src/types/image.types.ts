export interface Image {
  image_id: number;
  project_id: number;
  file_path: string;
  original_filename: string;
  width: number;
  height: number;
  upload_date: Date;
  status: "uploaded" | "annotated" | "processed";
  batch_name?: string;
}

export interface ImageInput {
  project_id: number;
  file_path: string;
  original_filename: string;
  width: number;
  height: number;
  batch_name?: string;
  class_ids?: number[]; // Optional class IDs to associate with the image
}
