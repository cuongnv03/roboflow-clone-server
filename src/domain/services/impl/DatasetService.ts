import { IDatasetService } from "../IDatasetService";
import { IDatasetRepository } from "../../repositories/IDatasetRepository";
import { IProjectRepository } from "../../repositories/IProjectRepository";
import { IImageRepository } from "../../repositories/IImageRepository";
import { IAnnotationRepository } from "../../repositories/IAnnotationRepository";
import { IExportService } from "../IExportService";
import {
  DatasetCreateDTO,
  DatasetResponseDTO,
  DatasetImageAssignDTO,
  DatasetSplitDTO,
  DatasetExportOptionsDTO,
  DatasetExportResultDTO,
} from "../../dtos/dataset.dto";
import { DatasetSplit } from "../../../database/models/DatasetImage";
import { NotFoundError } from "../../../exceptions/NotFoundError";
import { InvalidRequestError } from "../../../exceptions/InvalidRequestError";
import { DatasetStatus } from "../../../database/models/Dataset";

export class DatasetService implements IDatasetService {
  constructor(
    private datasetRepository: IDatasetRepository,
    private projectRepository: IProjectRepository,
    private imageRepository: IImageRepository,
    private annotationRepository: IAnnotationRepository,
    private exportService: IExportService,
  ) {}

  async createDataset(
    userId: number,
    datasetData: DatasetCreateDTO,
  ): Promise<DatasetResponseDTO> {
    // Verify project ownership
    await this.projectRepository.verifyOwnership(datasetData.projectId, userId);

    // Create the dataset
    const dataset = await this.datasetRepository.create(datasetData.projectId, {
      name: datasetData.name,
      preprocessing_settings: datasetData.preprocessing || {},
      augmentation_settings: datasetData.augmentation || {},
    });

    // Initialize with default split ratios if provided
    if (datasetData.splitRatio) {
      // Implementation for auto-splitting will be added in the generateSplit method
      // Schedule split generation asynchronously
      this.generateInitialSplit(dataset.dataset_id, userId, datasetData);
    }

    return this.mapToDatasetResponseDTO(dataset, {
      train: 0,
      valid: 0,
      test: 0,
      total: 0,
    });
  }

  async getDataset(
    datasetId: number,
    userId: number,
  ): Promise<DatasetResponseDTO> {
    const dataset = await this.datasetRepository.findById(datasetId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(dataset.project_id, userId);

    // Get image counts
    const imageCounts = await this.datasetRepository.getImageCounts(datasetId);

    return this.mapToDatasetResponseDTO(dataset, imageCounts);
  }

  async getProjectDatasets(
    projectId: number,
    userId: number,
  ): Promise<DatasetResponseDTO[]> {
    // Verify project ownership
    await this.projectRepository.verifyOwnership(projectId, userId);

    // Get all datasets for this project
    const datasets = await this.datasetRepository.findByProjectId(projectId);

    // Map all datasets to DTOs with their image counts
    const results: DatasetResponseDTO[] = [];

    for (const dataset of datasets) {
      const imageCounts = await this.datasetRepository.getImageCounts(
        dataset.dataset_id,
      );
      results.push(this.mapToDatasetResponseDTO(dataset, imageCounts));
    }

    return results;
  }

  async deleteDataset(datasetId: number, userId: number): Promise<void> {
    const dataset = await this.datasetRepository.findById(datasetId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(dataset.project_id, userId);

    // Delete the dataset (this will cascade to dataset_images through database constraints)
    await this.datasetRepository.delete(datasetId);
  }

  async generateSplit(
    datasetId: number,
    userId: number,
    splitConfig: DatasetSplitDTO,
  ): Promise<DatasetResponseDTO> {
    const dataset = await this.datasetRepository.findById(datasetId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(dataset.project_id, userId);

    // Clear existing dataset images
    await this.datasetRepository.clearDatasetImages(datasetId);

    // Update dataset status to generating
    await this.datasetRepository.updateStatus(datasetId, "generating");

    try {
      if (splitConfig.strategy === "random") {
        if (!splitConfig.ratio) {
          throw new InvalidRequestError(
            "Ratio is required for random split strategy",
          );
        }

        // Get all annotated images from the project
        const projectImages = await this.imageRepository.findByProjectId(
          dataset.project_id,
        );

        // Validate the ratio
        const { train, valid, test } = splitConfig.ratio;
        if (Math.abs(train + valid + test - 1) > 0.001) {
          throw new InvalidRequestError("Split ratios must sum to 1");
        }

        // Shuffle the images
        const shuffled = [...projectImages].sort(() => 0.5 - Math.random());

        // Calculate split indices
        const trainCount = Math.floor(shuffled.length * train);
        const validCount = Math.floor(shuffled.length * valid);

        // Assign images to splits
        for (let i = 0; i < shuffled.length; i++) {
          let split: DatasetSplit;
          if (i < trainCount) {
            split = "train";
          } else if (i < trainCount + validCount) {
            split = "valid";
          } else {
            split = "test";
          }

          await this.datasetRepository.addImageToDataset(
            datasetId,
            shuffled[i].image_id,
            split,
          );
        }
      } else if (splitConfig.strategy === "manual") {
        if (
          !splitConfig.manualAssignments ||
          splitConfig.manualAssignments.length === 0
        ) {
          throw new InvalidRequestError(
            "Manual assignments are required for manual split strategy",
          );
        }

        // Process manual assignments
        for (const assignment of splitConfig.manualAssignments) {
          await this.datasetRepository.addImageToDataset(
            datasetId,
            assignment.imageId,
            assignment.split as DatasetSplit,
          );
        }
      } else {
        throw new InvalidRequestError("Invalid split strategy");
      }

      // Update dataset status to completed
      await this.datasetRepository.updateStatus(datasetId, "completed");

      // Get updated image counts
      const imageCounts = await this.datasetRepository.getImageCounts(
        datasetId,
      );

      return this.mapToDatasetResponseDTO(dataset, imageCounts);
    } catch (error) {
      // Update dataset status to failed
      await this.datasetRepository.updateStatus(datasetId, "failed");
      throw error;
    }
  }

  async assignImagesToSplit(
    datasetId: number,
    userId: number,
    assignData: DatasetImageAssignDTO,
  ): Promise<DatasetResponseDTO> {
    const dataset = await this.datasetRepository.findById(datasetId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(dataset.project_id, userId);

    // Update dataset status to generating
    await this.datasetRepository.updateStatus(datasetId, "generating");

    try {
      // Process image assignments
      for (const imageId of assignData.imageIds) {
        // Remove existing assignment if any
        await this.datasetRepository.removeImageFromDataset(datasetId, imageId);

        // Add new assignment
        await this.datasetRepository.addImageToDataset(
          datasetId,
          imageId,
          assignData.split as DatasetSplit,
        );
      }

      // Update dataset status to completed
      await this.datasetRepository.updateStatus(datasetId, "completed");

      // Get updated image counts
      const imageCounts = await this.datasetRepository.getImageCounts(
        datasetId,
      );

      return this.mapToDatasetResponseDTO(dataset, imageCounts);
    } catch (error) {
      // Update dataset status to failed
      await this.datasetRepository.updateStatus(datasetId, "failed");
      throw error;
    }
  }

  async getDatasetImages(
    datasetId: number,
    userId: number,
    split?: DatasetSplit,
  ): Promise<Array<{ id: number; split: string }>> {
    const dataset = await this.datasetRepository.findById(datasetId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(dataset.project_id, userId);

    // Get dataset images
    const images = await this.datasetRepository.getDatasetImages(
      datasetId,
      split,
    );

    return images.map((img) => ({
      id: img.id,
      split: img.split,
    }));
  }

  async exportDataset(
    datasetId: number,
    userId: number,
    options: DatasetExportOptionsDTO,
  ): Promise<DatasetExportResultDTO> {
    // Delegate to ExportService
    return this.exportService.exportDataset(datasetId, userId, options);
  }

  async generateDataset(
    datasetId: number,
    userId: number,
  ): Promise<DatasetResponseDTO> {
    const dataset = await this.datasetRepository.findById(datasetId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(dataset.project_id, userId);

    // Check if dataset has images
    const imageCounts = await this.datasetRepository.getImageCounts(datasetId);
    if (imageCounts.total === 0) {
      throw new InvalidRequestError("Dataset has no images assigned to splits");
    }

    // Update dataset status to generating
    await this.datasetRepository.updateStatus(datasetId, "generating");

    try {
      // Process dataset (preprocessing & augmentation)
      // In a real implementation, this would be a background job
      // For now, we'll just simulate it by waiting a short time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update dataset status to completed
      await this.datasetRepository.updateStatus(datasetId, "completed");

      return this.mapToDatasetResponseDTO(dataset, imageCounts);
    } catch (error) {
      // Update dataset status to failed
      await this.datasetRepository.updateStatus(datasetId, "failed");
      throw error;
    }
  }

  // Private helper methods
  private async generateInitialSplit(
    datasetId: number,
    userId: number,
    datasetData: DatasetCreateDTO,
  ): Promise<void> {
    try {
      // Get all relevant images based on filters
      let projectImages = await this.imageRepository.findByProjectId(
        datasetData.projectId,
      );

      // Filter by annotation status if specified
      if (
        datasetData.includeAnnotated !== undefined ||
        datasetData.includeUnlabeled !== undefined
      ) {
        projectImages = projectImages.filter((img) => {
          if (datasetData.includeAnnotated && img.status === "annotated")
            return true;
          if (datasetData.includeUnlabeled && img.status === "uploaded")
            return true;
          return false;
        });
      }

      // Filter by batch if specified
      if (datasetData.filterByBatch && datasetData.filterByBatch.length > 0) {
        projectImages = projectImages.filter(
          (img) =>
            img.batch_name &&
            datasetData.filterByBatch.includes(img.batch_name),
        );
      }

      // If no images match criteria, update status and return
      if (projectImages.length === 0) {
        await this.datasetRepository.updateStatus(datasetId, "completed");
        return;
      }

      // Update dataset status to generating
      await this.datasetRepository.updateStatus(datasetId, "generating");

      // Apply split ratio
      if (datasetData.splitRatio) {
        const { train, valid, test } = datasetData.splitRatio;

        // Validate the ratio
        if (Math.abs(train + valid + test - 1) > 0.001) {
          throw new InvalidRequestError("Split ratios must sum to 1");
        }

        // Shuffle the images
        const shuffled = [...projectImages].sort(() => 0.5 - Math.random());

        // Calculate split indices
        const trainCount = Math.floor(shuffled.length * train);
        const validCount = Math.floor(shuffled.length * valid);

        // Assign images to splits
        for (let i = 0; i < shuffled.length; i++) {
          let split: DatasetSplit;
          if (i < trainCount) {
            split = "train";
          } else if (i < trainCount + validCount) {
            split = "valid";
          } else {
            split = "test";
          }

          await this.datasetRepository.addImageToDataset(
            datasetId,
            shuffled[i].image_id,
            split,
          );
        }
      }

      // Update dataset status to completed
      await this.datasetRepository.updateStatus(datasetId, "completed");
    } catch (error) {
      console.error("Error generating initial split:", error);
      // Update dataset status to failed
      await this.datasetRepository.updateStatus(datasetId, "failed");
    }
  }

  // Helper method to map Dataset model to DTO
  private mapToDatasetResponseDTO(
    dataset: any,
    imageCounts: any,
  ): DatasetResponseDTO {
    return {
      id: dataset.dataset_id,
      projectId: dataset.project_id,
      name: dataset.name,
      status: dataset.status,
      createdDate: dataset.created_date.toISOString(),
      preprocessing: dataset.preprocessing_settings,
      augmentation: dataset.augmentation_settings,
      imageCount: imageCounts,
    };
  }
}
