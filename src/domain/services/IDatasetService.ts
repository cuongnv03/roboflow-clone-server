import {
  DatasetCreateDTO,
  DatasetResponseDTO,
  DatasetImageAssignDTO,
  DatasetSplitDTO,
  DatasetExportOptionsDTO,
  DatasetExportResultDTO,
} from "../dtos/dataset.dto";
import { DatasetSplit } from "../../database/models/DatasetImage";

export interface IDatasetService {
  createDataset(
    userId: number,
    datasetData: DatasetCreateDTO,
  ): Promise<DatasetResponseDTO>;

  getDataset(datasetId: number, userId: number): Promise<DatasetResponseDTO>;

  getProjectDatasets(
    projectId: number,
    userId: number,
  ): Promise<DatasetResponseDTO[]>;

  deleteDataset(datasetId: number, userId: number): Promise<void>;

  generateSplit(
    datasetId: number,
    userId: number,
    splitConfig: DatasetSplitDTO,
  ): Promise<DatasetResponseDTO>;

  assignImagesToSplit(
    datasetId: number,
    userId: number,
    assignData: DatasetImageAssignDTO,
  ): Promise<DatasetResponseDTO>;

  getDatasetImages(
    datasetId: number,
    userId: number,
    split?: DatasetSplit,
  ): Promise<Array<{ id: number; split: string }>>;

  exportDataset(
    datasetId: number,
    userId: number,
    options: DatasetExportOptionsDTO,
  ): Promise<DatasetExportResultDTO>;

  generateDataset(
    datasetId: number,
    userId: number,
  ): Promise<DatasetResponseDTO>;
}
