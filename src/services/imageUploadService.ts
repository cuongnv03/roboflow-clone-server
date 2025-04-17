import { s3, bucketName } from "../config/s3";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import AppError from "../utils/appError";

export class ImageUploadService {
  /**
   * Upload image to S3 and return URL and dimensions
   */
  static async uploadToS3(
    file: Express.Multer.File,
    projectId: number,
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
      let imageBuffer = file.buffer;
      let image = sharp(imageBuffer);

      // Get original metadata
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
      if (options.format) {
        image = image.toFormat(options.format, { quality: 90 });
      }

      // Process the image
      imageBuffer = await image.toBuffer();

      // Get final dimensions after processing
      const finalMetadata = await sharp(imageBuffer).metadata();

      // Generate filename with extension
      let extension = "jpg";
      if (options.format) {
        extension = options.format;
      } else if (metadata.format) {
        extension = metadata.format;
      }

      const fileName = `projects/${projectId}/${uuidv4()}.${extension}`;

      // Set content type based on format
      let contentType = "image/jpeg";
      if (extension === "png") contentType = "image/png";
      if (extension === "webp") contentType = "image/webp";

      // Upload to S3
      const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: imageBuffer,
        ContentType: contentType,
        // ACL: "public-read",
      };

      const uploadResult = await s3.upload(params).promise();

      return {
        url: uploadResult.Location,
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
      };
    } catch (error) {
      console.error("S3 Upload Error:", error);
      throw new AppError(`Failed to upload image to S3: ${error.message}`, 500);
    }
  }

  /**
   * Delete image from S3
   */
  static async deleteFromS3(fileUrl: string): Promise<void> {
    try {
      // Extract the Key from the full S3 URL
      const urlParts = fileUrl.split("/");
      const key = urlParts.slice(3).join("/");

      const params = {
        Bucket: bucketName,
        Key: key,
      };

      await s3.deleteObject(params).promise();
    } catch (error) {
      console.error("S3 Delete Error:", error);
      throw new AppError("Failed to delete image from S3", 500);
    }
  }
}
