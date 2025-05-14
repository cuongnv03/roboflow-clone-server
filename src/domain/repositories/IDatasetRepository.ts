import Dataset, {
  DatasetCreationAttributes,
  DatasetStatus,
} from "../../database/models/Dataset";
import { DatasetSplit } from "../../database/models/DatasetImage";

export interface DatasetImageCount {
  train: number;
  valid: number;
  test: number;
  total: number;
}

export interface IDatasetRepository {
  create(
    projectId: number,
    datasetData: Omit<DatasetCreationAttributes, "project_id">,
  ): Promise<Dataset>;

  findById(datasetId: number): Promise<Dataset>;

  findByProjectId(projectId: number): Promise<Dataset[]>;

  updateStatus(datasetId: number, status: DatasetStatus): Promise<Dataset>;

  delete(datasetId: number): Promise<void>;

  // Methods for dataset images
  addImageToDataset(
    datasetId: number,
    imageId: number,
    split: DatasetSplit,
  ): Promise<void>;

  getDatasetImages(
    datasetId: number,
    split?: DatasetSplit,
  ): Promise<Array<{ id: number; split: string }>>;

  getImageCounts(datasetId: number): Promise<DatasetImageCount>;

  removeImageFromDataset(datasetId: number, imageId: number): Promise<void>;

  clearDatasetImages(datasetId: number): Promise<void>;
}
