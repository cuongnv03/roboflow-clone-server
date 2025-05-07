import {
  DatasetExportOptionsDTO,
  DatasetExportResultDTO,
} from "../dtos/dataset.dto";

export interface IExportService {
  exportDataset(
    datasetId: number,
    userId: number,
    options: DatasetExportOptionsDTO,
  ): Promise<DatasetExportResultDTO>;

  getExportFormats(projectType: string): Promise<string[]>;

  generateExportPreview(
    datasetId: number,
    userId: number,
    format: string,
  ): Promise<{ sample: string }>;
}
