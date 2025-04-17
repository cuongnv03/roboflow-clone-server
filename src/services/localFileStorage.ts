import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import AppError from "../utils/appError";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
const projectsDir = path.join(uploadsDir, "projects");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

export class LocalFileStorage {
  /**
   * Save file to local storage and return URL
   */
  static async saveFile(
    file: Buffer,
    projectId: number,
    filename: string,
    options: {
      resize?: { width: number; height: number };
      autoOrient?: boolean;
      format?: "jpeg" | "png" | "webp";
    } = {},
  ): Promise<{
    url: string;
    width: number;
    height: number;
  }> {
    try {
      // Create project directory if it doesn't exist
      const projectDir = path.join(projectsDir, projectId.toString());
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }

      // Process image with sharp
      let image = sharp(file);

      // Get metadata
      const metadata = await image.metadata();

      // Apply auto-orientation if requested
      if (options.autoOrient !== false) {
        image = image.rotate(); // auto-orient based on EXIF data
      }

      // Resize if requested
      if (options.resize) {
        image = image.resize({
          width: options.resize.width,
          height: options.resize.height,
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Convert format if requested
      let extension = path.extname(filename).substring(1) || "jpg";
      if (options.format) {
        extension = options.format;
        image = image.toFormat(options.format, { quality: 90 });
      }

      // Generate unique filename
      const uniqueFilename = `${uuidv4()}.${extension}`;
      const filePath = path.join(projectDir, uniqueFilename);

      // Save file
      await image.toFile(filePath);

      // Get final dimensions after processing
      const finalMetadata = await sharp(filePath).metadata();

      // Generate public URL (for development, this is a local path)
      const baseUrl =
        process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      const publicUrl = `${baseUrl}/uploads/projects/${projectId}/${uniqueFilename}`;

      return {
        url: publicUrl,
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
      };
    } catch (error) {
      console.error("Local file storage error:", error);
      throw new AppError(`Failed to save file locally: ${error.message}`, 500);
    }
  }

  /**
   * Delete a file from local storage
   */
  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract the filename from the URL
      const urlParts = fileUrl.split("/");
      const projectId = urlParts[urlParts.length - 2];
      const filename = urlParts[urlParts.length - 1];

      const filePath = path.join(projectsDir, projectId, filename);

      // Check if file exists before trying to delete
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("Error deleting local file:", error);
      throw new AppError(`Failed to delete file: ${error.message}`, 500);
    }
  }
}
