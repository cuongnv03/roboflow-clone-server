import {
  IStorageProvider,
  FileUploadResult,
  FileUploadOptions,
} from "../interfaces/IStorageProvider";
import AWS from "aws-sdk";
import sharp from "sharp";
import { FileUploadError } from "../../../exceptions/FileUploadError";
import { getErrorMessage } from "../../../utils/errorHandling";
import { v4 as uuidv4 } from "uuid";

export class S3StorageProvider implements IStorageProvider {
  private s3: AWS.S3;
  private bucketName: string;
  private region: string;

  constructor() {
    // Configure AWS SDK
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || "us-east-1",
    });

    this.s3 = new AWS.S3();
    this.bucketName = process.env.S3_BUCKET || "roboflow-clone-images";
    this.region = process.env.AWS_REGION || "us-east-1";
  }

  async uploadFile(
    file: Express.Multer.File,
    directory: string,
    filename: string,
    options: FileUploadOptions = {},
  ): Promise<FileUploadResult> {
    try {
      const isImage = file.mimetype.startsWith("image/");
      let processedBuffer = file.buffer;
      let contentType = file.mimetype;
      let width = 0;
      let height = 0;

      if (isImage) {
        // Process image with sharp
        let imageProcessor = sharp(file.buffer);

        // Get original metadata
        const metadata = await imageProcessor.metadata();
        width = metadata.width || 0;
        height = metadata.height || 0;

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

          // Update dimensions after resize
          const resizedMetadata = await imageProcessor.metadata();
          width = resizedMetadata.width || width;
          height = resizedMetadata.height || height;
        }

        // Determine output format
        const format = options.format || "jpeg";

        // Convert format if requested
        if (format === "jpeg") {
          imageProcessor = imageProcessor.jpeg({ quality: 90 });
          contentType = "image/jpeg";
        } else if (format === "png") {
          imageProcessor = imageProcessor.png({ quality: 90 });
          contentType = "image/png";
        } else if (format === "webp") {
          imageProcessor = imageProcessor.webp({ quality: 90 });
          contentType = "image/webp";
        }

        // Get processed buffer
        processedBuffer = await imageProcessor.toBuffer();
      }

      // Create S3 key (file path)
      const extension = isImage
        ? options.format
          ? `.${options.format}`
          : ".jpg"
        : "";
      const key = `${directory}/${filename}${extension}`;

      // Upload to S3
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: processedBuffer,
        ContentType: contentType,
        ACL: "public-read", // Make files publicly accessible
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      };

      const uploadResult = await this.s3.upload(uploadParams).promise();

      return {
        url: uploadResult.Location,
        width,
        height,
      };
    } catch (error) {
      console.error("S3 Upload Error:", error);
      throw new FileUploadError(
        `Failed to upload file to S3: ${getErrorMessage(error)}`,
      );
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // Extract key from S3 URL
      const key = this.extractKeyFromUrl(filePath);

      if (!key) {
        console.warn(`Invalid S3 URL for deletion: ${filePath}`);
        return;
      }

      const deleteParams: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3.deleteObject(deleteParams).promise();
      console.log(`Successfully deleted S3 object: ${key}`);
    } catch (error) {
      console.error("S3 Delete Error:", error);
      throw new FileUploadError(
        `Failed to delete file from S3: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Delete multiple files from S3 (for project cleanup)
   */
  async deleteDirectory(directoryPrefix: string): Promise<void> {
    try {
      // List all objects with the directory prefix
      const listParams: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucketName,
        Prefix: directoryPrefix,
      };

      const listedObjects = await this.s3.listObjectsV2(listParams).promise();

      if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
        return;
      }

      // Prepare delete parameters
      const deleteParams: AWS.S3.DeleteObjectsRequest = {
        Bucket: this.bucketName,
        Delete: {
          Objects: listedObjects.Contents.map((obj) => ({ Key: obj.Key! })),
        },
      };

      // Delete all objects
      await this.s3.deleteObjects(deleteParams).promise();
      console.log(`Successfully deleted S3 directory: ${directoryPrefix}`);
    } catch (error) {
      console.error("S3 Directory Delete Error:", error);
      throw new FileUploadError(
        `Failed to delete directory from S3: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Get project directory prefix for S3
   */
  getProjectDirectory(projectId: number): string {
    return `projects/${projectId}`;
  }

  /**
   * Extract S3 key from full S3 URL
   */
  private extractKeyFromUrl(url: string): string | null {
    try {
      // Handle different S3 URL formats
      if (url.includes(`${this.bucketName}.s3.`)) {
        // Format: https://bucket.s3.region.amazonaws.com/key
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1); // Remove leading /
      } else if (
        url.includes(`s3.${this.region}.amazonaws.com/${this.bucketName}`)
      ) {
        // Format: https://s3.region.amazonaws.com/bucket/key
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/");
        return pathParts.slice(2).join("/"); // Remove /bucket part
      }

      return null;
    } catch (error) {
      console.error("Error extracting key from S3 URL:", error);
      return null;
    }
  }

  /**
   * Generate presigned URL for temporary access (optional feature)
   */
  async generatePresignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expiresIn,
    };

    return this.s3.getSignedUrl("getObject", params);
  }
}
