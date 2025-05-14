import {
  ImageResponseDTO,
  ImageUploadOptionsDTO,
  BatchUploadResultDTO,
} from "../dtos/image.dto";
import { ImageStatus } from "../../database/models/Image";

export interface IImageService {
  uploadImage(
    file: Express.Multer.File,
    projectId: number,
    userId: number,
    options?: ImageUploadOptionsDTO,
  ): Promise<ImageResponseDTO>;

  uploadMultipleImages(
    files: Express.Multer.File[],
    projectId: number,
    userId: number,
    options?: ImageUploadOptionsDTO,
  ): Promise<BatchUploadResultDTO>;

  getProjectImages(
    projectId: number,
    userId: number,
    batchName?: string,
  ): Promise<ImageResponseDTO[]>;
  getProjectBatches(projectId: number, userId: number): Promise<string[]>;
  getImage(
    imageId: number,
    projectId: number,
    userId: number,
  ): Promise<ImageResponseDTO>;
  deleteImage(imageId: number, userId: number): Promise<void>;
  updateImageStatus(
    imageId: number,
    userId: number,
    status: ImageStatus,
  ): Promise<ImageResponseDTO>;
}
