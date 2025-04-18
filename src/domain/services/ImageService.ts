import { IImageService } from "../interfaces/IImageService";
import { IImageRepository } from "../interfaces/IImageRepository";
import { IProjectRepository } from "../interfaces/IProjectRepository";
import { IStorageProvider } from "../../infrastructure/storage/interfaces/IStorageProvider";
import {
  ImageResponseDTO,
  ImageUploadOptionsDTO,
  BatchUploadResultDTO,
} from "../dtos/image.dto";
import { ImageStatus } from "../../database/models/Image";
import { generateUniqueFilename } from "../../utils/fileUtils";

export class ImageService implements IImageService {
  constructor(
    private imageRepository: IImageRepository,
    private projectRepository: IProjectRepository,
    private storageProvider: IStorageProvider,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    projectId: number,
    userId: number,
    options: ImageUploadOptionsDTO = {},
  ): Promise<ImageResponseDTO> {
    // Verify project ownership
    await this.projectRepository.verifyOwnership(projectId, userId);

    // Generate unique filename
    const filename = generateUniqueFilename(file.originalname);

    // Upload to storage
    const uploadResult = await this.storageProvider.uploadFile(
      file,
      `projects/${projectId}`,
      filename,
      {
        resize: options.resize,
        autoOrient: options.autoOrient,
        format: options.format,
      },
    );

    // Save to database
    const image = await this.imageRepository.create(projectId, {
      file_path: uploadResult.url,
      original_filename: file.originalname,
      width: uploadResult.width,
      height: uploadResult.height,
      batch_name: options.batchName,
    });

    // Map to DTO
    return this.mapToImageResponseDTO(image);
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    projectId: number,
    userId: number,
    options: ImageUploadOptionsDTO = {},
  ): Promise<BatchUploadResultDTO> {
    // Verify project ownership
    await this.projectRepository.verifyOwnership(projectId, userId);

    const uploadedImages: ImageResponseDTO[] = [];
    const failedUploads: Array<{ filename: string; error: string }> = [];

    // Process each file
    for (const file of files) {
      try {
        const image = await this.uploadImage(file, projectId, userId, options);
        uploadedImages.push(image);
      } catch (error) {
        console.error(`Error uploading file ${file.originalname}:`, error);
        failedUploads.push({
          filename: file.originalname,
          error: error.message,
        });
      }
    }

    return {
      uploadedImages,
      failedUploads,
      totalUploaded: uploadedImages.length,
      totalFailed: failedUploads.length,
    };
  }

  async getProjectImages(
    projectId: number,
    userId: number,
    batchName?: string,
  ): Promise<ImageResponseDTO[]> {
    // Verify project ownership
    await this.projectRepository.verifyOwnership(projectId, userId);

    // Get images based on batch name
    const images = batchName
      ? await this.imageRepository.findByBatchName(projectId, batchName)
      : await this.imageRepository.findByProjectId(projectId);

    // Map to DTOs
    return images.map((image) => this.mapToImageResponseDTO(image));
  }

  async getProjectBatches(
    projectId: number,
    userId: number,
  ): Promise<string[]> {
    // Verify project ownership
    await this.projectRepository.verifyOwnership(projectId, userId);

    return this.imageRepository.getBatchNames(projectId);
  }

  async deleteImage(imageId: number, userId: number): Promise<void> {
    // Get image data
    const image = await this.imageRepository.findById(imageId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(image.project_id, userId);

    // Delete from storage
    await this.storageProvider.deleteFile(image.file_path);

    // Delete from database
    await this.imageRepository.delete(imageId);
  }

  async updateImageStatus(
    imageId: number,
    userId: number,
    status: ImageStatus,
  ): Promise<ImageResponseDTO> {
    // Get image data
    const image = await this.imageRepository.findById(imageId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(image.project_id, userId);

    // Update status
    const updatedImage = await this.imageRepository.updateStatus(
      imageId,
      status,
    );

    // Map to DTO
    return this.mapToImageResponseDTO(updatedImage);
  }

  // Helper method to map Image model to DTO
  private mapToImageResponseDTO(image: any): ImageResponseDTO {
    return {
      id: image.image_id,
      projectId: image.project_id,
      filePath: image.file_path,
      originalFilename: image.original_filename,
      width: image.width,
      height: image.height,
      uploadDate: image.upload_date.toISOString(),
      status: image.status,
      batchName: image.batch_name || undefined,
    };
  }
}
