import { Request, Response, NextFunction } from "express";
import { ImageModel } from "../models/imageModel";
import { ProjectModel } from "../models/projectModel";
import { ImageUploadService } from "../services/imageUploadService";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse, errorResponse } from "../utils/responseFormatter";
import AppError from "../utils/appError";
import { pool } from "../config/database";

export const uploadImage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    if (!req.file) {
      return next(new AppError("No file uploaded", 400));
    }

    const projectId = Number(req.params.projectId);
    const batchName = req.body.batchName || null;

    // Verify project belongs to user
    await ProjectModel.verifyProjectOwnership(projectId, req.user.id);

    // Process upload options
    const uploadOptions = {
      resize: req.body.resize ? JSON.parse(req.body.resize) : undefined,
      autoOrient: req.body.autoOrient !== "false",
      format: req.body.format,
    };

    // Upload to S3
    const uploadResult = await ImageUploadService.uploadToS3(
      req.file,
      projectId,
      uploadOptions,
    );

    // Create image record in database
    const imageData = {
      project_id: projectId,
      file_path: uploadResult.url,
      original_filename: req.file.originalname,
      width: uploadResult.width,
      height: uploadResult.height,
      batch_name: batchName,
    };

    const image = await ImageModel.create(imageData);

    return successResponse(res, image, 201, "Image uploaded successfully");
  },
);

export const uploadMultipleImages = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return next(new AppError("No files uploaded", 400));
    }

    const projectId = Number(req.params.projectId);
    const batchName = req.body.batchName || null;

    // Verify project belongs to user
    await ProjectModel.verifyProjectOwnership(projectId, req.user.id);

    // Process upload options
    const uploadOptions = {
      resize: req.body.resize ? JSON.parse(req.body.resize) : undefined,
      autoOrient: req.body.autoOrient !== "false",
      format: req.body.format,
    };

    const uploadedImages = [];
    const failedUploads = [];

    // Process each file
    for (const file of req.files as Express.Multer.File[]) {
      try {
        // Upload to S3
        const uploadResult = await ImageUploadService.uploadToS3(
          file,
          projectId,
          uploadOptions,
        );

        // Create image record in database
        const imageData = {
          project_id: projectId,
          file_path: uploadResult.url,
          original_filename: file.originalname,
          width: uploadResult.width,
          height: uploadResult.height,
          batch_name: batchName,
        };

        const image = await ImageModel.create(imageData);
        uploadedImages.push(image);
      } catch (error) {
        console.error(`Error uploading file ${file.originalname}:`, error);
        failedUploads.push({
          filename: file.originalname,
          error: error.message,
        });
      }
    }

    return successResponse(
      res,
      {
        uploadedImages,
        failedUploads,
        totalUploaded: uploadedImages.length,
        totalFailed: failedUploads.length,
      },
      201,
      `${uploadedImages.length} images uploaded successfully, ${failedUploads.length} failed`,
    );
  },
);

export const getProjectImages = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    const projectId = Number(req.params.projectId);

    // Verify project belongs to user
    await ProjectModel.verifyProjectOwnership(projectId, req.user.id);

    // Get images based on query params
    let images;
    if (req.query.batchName) {
      images = await ImageModel.findByBatchName(
        projectId,
        req.query.batchName as string,
      );
    } else {
      images = await ImageModel.findByProjectId(projectId);
    }

    return successResponse(
      res,
      images,
      200,
      "Project images retrieved successfully",
    );
  },
);

export const getProjectBatches = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    const projectId = Number(req.params.projectId);

    // Verify project belongs to user
    await ProjectModel.verifyProjectOwnership(projectId, req.user.id);

    // Get all unique batch names for the project
    const [rows] = await pool.execute(
      "SELECT DISTINCT batch_name FROM Images WHERE project_id = ? AND batch_name IS NOT NULL",
      [projectId],
    );

    const batches = (rows as { batch_name: string }[]).map(
      (row) => row.batch_name,
    );

    return successResponse(
      res,
      batches,
      200,
      "Project batch names retrieved successfully",
    );
  },
);

export const deleteImage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    const imageId = Number(req.params.imageId);

    // Get the image to get its file path
    const image = await ImageModel.findById(imageId);

    // Get the project to verify ownership
    await ProjectModel.verifyProjectOwnership(image.project_id, req.user.id);

    // Delete from S3
    await ImageUploadService.deleteFromS3(image.file_path);

    // Delete from database
    await ImageModel.delete(imageId);

    return successResponse(res, null, 200, "Image deleted successfully");
  },
);

export const updateImageStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    const imageId = Number(req.params.imageId);
    const { status } = req.body;

    if (!["uploaded", "annotated", "processed"].includes(status)) {
      return next(new AppError("Invalid status", 400));
    }

    // Get the image to get its project
    const image = await ImageModel.findById(imageId);

    // Verify project belongs to user
    await ProjectModel.verifyProjectOwnership(image.project_id, req.user.id);

    // Update status
    const updatedImage = await ImageModel.updateStatus(imageId, status);

    return successResponse(
      res,
      updatedImage,
      200,
      "Image status updated successfully",
    );
  },
);
