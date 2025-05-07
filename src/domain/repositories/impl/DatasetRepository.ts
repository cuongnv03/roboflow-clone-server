import { IDatasetRepository, DatasetImageCount } from "../IDatasetRepository";
import Dataset, {
  DatasetCreationAttributes,
  DatasetStatus,
} from "../../../database/models/Dataset";
import DatasetImage, {
  DatasetSplit,
} from "../../../database/models/DatasetImage";
import Image from "../../../database/models/Image";
import { NotFoundError } from "../../../exceptions/NotFoundError";
import sequelize from "../../../config/database";

export class DatasetRepository implements IDatasetRepository {
  async create(
    projectId: number,
    datasetData: Omit<DatasetCreationAttributes, "project_id">,
  ): Promise<Dataset> {
    return Dataset.create({
      ...datasetData,
      project_id: projectId,
    });
  }

  async findById(datasetId: number): Promise<Dataset> {
    const dataset = await Dataset.findByPk(datasetId);
    if (!dataset) {
      throw new NotFoundError("Dataset not found");
    }
    return dataset;
  }

  async findByProjectId(projectId: number): Promise<Dataset[]> {
    return Dataset.findAll({
      where: { project_id: projectId },
      order: [["created_date", "DESC"]],
    });
  }

  async updateStatus(
    datasetId: number,
    status: DatasetStatus,
  ): Promise<Dataset> {
    const dataset = await this.findById(datasetId);
    await dataset.update({ status });
    return dataset;
  }

  async delete(datasetId: number): Promise<void> {
    const dataset = await this.findById(datasetId);
    await dataset.destroy();
  }

  async addImageToDataset(
    datasetId: number,
    imageId: number,
    split: DatasetSplit,
  ): Promise<void> {
    await DatasetImage.create({
      dataset_id: datasetId,
      image_id: imageId,
      split,
    });
  }

  async getDatasetImages(
    datasetId: number,
    split?: DatasetSplit,
  ): Promise<{ id: number; split: DatasetSplit }[]> {
    const whereClause: any = { dataset_id: datasetId };
    if (split) {
      whereClause.split = split;
    }

    const datasetImages = await DatasetImage.findAll({
      where: whereClause,
      include: [{ model: Image, attributes: ["image_id"] }],
    });

    return datasetImages.map((di) => ({
      id: di.image_id,
      split: di.split,
    }));
  }

  async getImageCounts(datasetId: number): Promise<DatasetImageCount> {
    const [rows] = await sequelize.query(
      `
      SELECT split, COUNT(*) as count
      FROM Dataset_Images
      WHERE dataset_id = ?
      GROUP BY split
    `,
      {
        replacements: [datasetId],
      },
    );

    const counts: DatasetImageCount = {
      train: 0,
      valid: 0,
      test: 0,
      total: 0,
    };

    (rows as any[]).forEach((row) => {
      const split = row.split as DatasetSplit;
      const count = parseInt(row.count, 10);
      counts[split] = count;
      counts.total += count;
    });

    return counts;
  }

  async removeImageFromDataset(
    datasetId: number,
    imageId: number,
  ): Promise<void> {
    await DatasetImage.destroy({
      where: {
        dataset_id: datasetId,
        image_id: imageId,
      },
    });
  }

  async clearDatasetImages(datasetId: number): Promise<void> {
    await DatasetImage.destroy({
      where: {
        dataset_id: datasetId,
      },
    });
  }
}
