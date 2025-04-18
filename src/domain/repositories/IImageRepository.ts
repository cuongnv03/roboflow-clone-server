import Image, {
  ImageCreationAttributes,
  ImageStatus,
} from "../../database/models/Image";

export interface IImageRepository {
  create(
    projectId: number,
    imageData: Omit<ImageCreationAttributes, "project_id">,
  ): Promise<Image>;
  findById(imageId: number): Promise<Image>;
  findByProjectId(projectId: number): Promise<Image[]>;
  findByBatchName(projectId: number, batchName: string): Promise<Image[]>;
  getBatchNames(projectId: number): Promise<string[]>;
  updateStatus(imageId: number, status: ImageStatus): Promise<Image>;
  delete(imageId: number): Promise<void>;
}
