import {
  IStorageProvider,
  FileUploadResult,
  FileUploadOptions,
} from "../interfaces/IStorageProvider";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { FileUploadError } from "../../../exceptions/FileUploadError";
import { ensureDirectoryExists } from "../../../utils/fileUtils";

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;
  private baseUrl: string;

  constructor(
    baseDir: string = path.join(process.cwd(), "uploads"),
    baseUrl: string = "/uploads",
  ) {
    this.baseDir = baseDir;
    this.baseUrl = baseUrl;

    // Ensure base directory exists
    ensureDirectoryExists(this.baseDir);
  }

  async uploadFile(
    file: Express.Multer.File,
    directory: string,
    filename: string,
    options: FileUploadOptions = {},
  ): Promise<FileUploadResult> {
    try {
      // Create full directory path
      const dirPath = path.join(this.baseDir, directory);
      ensureDirectoryExists(dirPath);

      // Process image with sharp
      let imageProcessor = sharp(file.buffer);

      // Get original metadata
      const metadata = await imageProcessor.metadata();

      // Apply auto-orientation if requested
      if (options.autoOrient !== false) {
        imageProcessor = imageProcessor.rotate(); // auto-orient based on EXIF data
      }

      // Resize if requested
      if (options.resize) {
        imageProcessor = imageProcessor.resize({
          width: options.resize.width,
          height: options.resize.height,
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Determine output format
      let format = options.format || metadata.format || "jpeg";
      let extension = format;

      // Convert format if requested
      imageProcessor = imageProcessor.toFormat(format, { quality: 90 });

      // Final filename with extension
      const finalFilename = `${filename}.${extension}`;
      const filePath = path.join(dirPath, finalFilename);

      // Write file to disk
      await imageProcessor.toFile(filePath);

      // Get final dimensions
      const finalMetadata = await sharp(filePath).metadata();

      // Generate public URL
      const urlPath = path
        .join(this.baseUrl, directory, finalFilename)
        .replace(/\\/g, "/");

      return {
        url: urlPath,
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
      };
    } catch (error) {
      console.error("File Upload Error:", error);
      throw new FileUploadError(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // Convert URL path to file system path
      const localPath = filePath
        .replace(this.baseUrl, this.baseDir)
        .replace(/\//g, path.sep);

      // Check if file exists before attempting to delete
      if (fs.existsSync(localPath)) {
        await fs.promises.unlink(localPath);
      } else {
        console.warn(`File not found for deletion: ${localPath}`);
      }
    } catch (error) {
      console.error("File Delete Error:", error);
      throw new FileUploadError(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Delete a directory and all its contents
   */
  async deleteDirectory(dirPath: string): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        return;
      }

      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Đệ quy xóa thư mục con
          await this.deleteDirectory(filePath);
        } else {
          // Xóa file
          fs.unlinkSync(filePath);
        }
      }

      // Xóa thư mục cha (đã rỗng)
      fs.rmdirSync(dirPath);
    } catch (error) {
      throw new Error(`Failed to delete directory: ${error.message}`);
    }
  }

  /**
   * Get project directory path from project ID
   */
  getProjectDirectory(projectId: number): string {
    return path.join(this.baseDir, "projects", projectId.toString());
  }
}
