import { pool } from "../config/database";
import { Image, ImageInput } from "../types/image.types";
import AppError from "../utils/appError";

export class ImageModel {
  /**
   * Create a new image record
   */
  static async create(imageData: ImageInput): Promise<Image> {
    const [result] = await pool.execute(
      "INSERT INTO Images (project_id, file_path, original_filename, width, height, batch_name) VALUES (?, ?, ?, ?, ?, ?)",
      [
        imageData.project_id,
        imageData.file_path,
        imageData.original_filename,
        imageData.width,
        imageData.height,
        imageData.batch_name || null,
      ],
    );

    const imageId = (result as any).insertId;
    return this.findById(imageId);
  }

  /**
   * Find image by ID
   */
  static async findById(imageId: number): Promise<Image> {
    const [rows] = await pool.execute(
      "SELECT * FROM Images WHERE image_id = ?",
      [imageId],
    );

    const images = rows as Image[];
    if (!images.length) {
      throw new AppError("Image not found", 404);
    }

    return images[0];
  }

  /**
   * Get all images for a project
   */
  static async findByProjectId(projectId: number): Promise<Image[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM Images WHERE project_id = ? ORDER BY upload_date DESC",
      [projectId],
    );

    return rows as Image[];
  }

  /**
   * Get images by batch name
   */
  static async findByBatchName(
    projectId: number,
    batchName: string,
  ): Promise<Image[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM Images WHERE project_id = ? AND batch_name = ? ORDER BY upload_date DESC",
      [projectId, batchName],
    );

    return rows as Image[];
  }

  /**
   * Update image status
   */
  static async updateStatus(imageId: number, status: string): Promise<Image> {
    await pool.execute("UPDATE Images SET status = ? WHERE image_id = ?", [
      status,
      imageId,
    ]);

    return this.findById(imageId);
  }

  /**
   * Delete an image
   */
  static async delete(imageId: number): Promise<void> {
    await pool.execute("DELETE FROM Images WHERE image_id = ?", [imageId]);
  }
}
