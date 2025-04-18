import { Request, Response } from "express";
import { IImageService } from "../../domain/interfaces/IImageService";
import {
  ImageUploadOptionsDTO,
  ImageStatusUpdateDTO,
} from "../../domain/dtos/image.dto";
import { asyncHandler } from "../middlewares/asyncHandler";
import { InvalidRequestError } from "../../exceptions/InvalidRequestError";
import { ImageStatus } from "../../database/models/Image";

export class ImageController {
  constructor(private imageService: IImageService) {}

  uploadImage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new InvalidRequestError("No file uploaded");
    }

    const projectId = parseInt(req.params.projectId);
    const options = this.parseUploadOptions(req);

    const image = await this.imageService.uploadImage(
      req.file,
      projectId,
      req.user.id,
      options,
    );

    res.status(201).json({
      status: "success",
      message: "Image uploaded successfully",
      data: image,
    });
  });

  uploadMultipleImages = asyncHandler(async (req: Request, res: Response) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new InvalidRequestError("No files uploaded");
    }

    const projectId = parseInt(req.params.projectId);
    const options = this.parseUploadOptions(req);

    const result = await this.imageService.uploadMultipleImages(
      req.files as Express.Multer.File[],
      projectId,
      req.user.id,
      options,
    );

    res.status(201).json({
      status: "success",
      message: `${result.totalUploaded} images uploaded successfully, ${result.totalFailed} failed`,
      data: result,
    });
  });

  getProjectImages = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const batchName = req.query.batchName as string | undefined;

    const images = await this.imageService.getProjectImages(
      projectId,
      req.user.id,
      batchName,
    );

    res.status(200).json({
      status: "success",
      message: "Project images retrieved successfully",
      data: images,
    });
  });

  getProjectBatches = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const batches = await this.imageService.getProjectBatches(
      projectId,
      req.user.id,
    );

    res.status(200).json({
      status: "success",
      message: "Project batch names retrieved successfully",
      data: batches,
    });
  });

  deleteImage = asyncHandler(async (req: Request, res: Response) => {
    const imageId = parseInt(req.params.imageId);
    await this.imageService.deleteImage(imageId, req.user.id);

    res.status(200).json({
      status: "success",
      message: "Image deleted successfully",
      data: null,
    });
  });

  updateImageStatus = asyncHandler(async (req: Request, res: Response) => {
    const imageId = parseInt(req.params.imageId);
    const { status } = req.body as ImageStatusUpdateDTO;

    if (!["uploaded", "annotated", "processed"].includes(status)) {
      throw new InvalidRequestError("Invalid status");
    }

    const updatedImage = await this.imageService.updateImageStatus(
      imageId,
      req.user.id,
      status as ImageStatus,
    );

    res.status(200).json({
      status: "success",
      message: "Image status updated successfully",
      data: updatedImage,
    });
  });

  private parseUploadOptions(req: Request): ImageUploadOptionsDTO {
    return {
      resize: req.body.resize ? JSON.parse(req.body.resize) : undefined,
      autoOrient: req.body.autoOrient !== "false",
      format: req.body.format,
      batchName: req.body.batchName || null,
    };
  }
}
