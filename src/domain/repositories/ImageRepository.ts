import { IImageRepository } from "../interfaces/IImageRepository";
import Image, {
  ImageCreationAttributes,
  ImageStatus,
} from "../../database/models/Image";
import { NotFoundError } from "../../exceptions/NotFoundError";
import sequelize from "../../config/database";

export class ImageRepository implements IImageRepository {
  async create(
    projectId: number,
    imageData: Omit<ImageCreationAttributes, "project_id">,
  ): Promise<Image> {
    return Image.create({
      ...imageData,
      project_id: projectId,
    });
  }

  async findById(imageId: number): Promise<Image> {
    const image = await Image.findByPk(imageId);
    if (!image) {
      throw new NotFoundError("Image not found");
    }
    return image;
  }

  async findByProjectId(projectId: number): Promise<Image[]> {
    return Image.findAll({
      where: { project_id: projectId },
      order: [["upload_date", "DESC"]],
    });
  }

  async findByBatchName(
    projectId: number,
    batchName: string,
  ): Promise<Image[]> {
    return Image.findAll({
      where: {
        project_id: projectId,
        batch_name: batchName,
      },
      order: [["upload_date", "DESC"]],
    });
  }

  async getBatchNames(projectId: number): Promise<string[]> {
    const [rows] = await sequelize.query(
      `
      SELECT DISTINCT batch_name 
      FROM Images 
      WHERE project_id = ? AND batch_name IS NOT NULL
    `,
      {
        replacements: [projectId],
      },
    );

    return (rows as Array<{ batch_name: string }>)
      .map((row) => row.batch_name)
      .filter((name) => name !== null);
  }

  async updateStatus(imageId: number, status: ImageStatus): Promise<Image> {
    const image = await Image.findByPk(imageId);
    if (!image) {
      throw new NotFoundError("Image not found");
    }

    await image.update({ status });
    return image;
  }

  async delete(imageId: number): Promise<void> {
    const image = await Image.findByPk(imageId);
    if (!image) {
      throw new NotFoundError("Image not found");
    }

    await image.destroy();
  }
}
