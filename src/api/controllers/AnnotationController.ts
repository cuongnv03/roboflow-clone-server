import { Request, Response } from "express";
import { IAnnotationService } from "../../domain/services/IAnnotationService";
import {
  AnnotationCreateDTO,
  AnnotationUpdateDTO,
  BatchAnnotationDTO,
} from "../../domain/dtos/annotation.dto";
import { asyncHandler } from "../middlewares/asyncHandler";

export class AnnotationController {
  constructor(private annotationService: IAnnotationService) {}

  createAnnotation = asyncHandler(async (req: Request, res: Response) => {
    const annotationData: AnnotationCreateDTO = req.body;
    const annotation = await this.annotationService.createAnnotation(
      req.user.id,
      annotationData,
    );

    res.status(201).json({
      status: "success",
      message: "Annotation created successfully",
      data: annotation,
    });
  });

  getImageAnnotations = asyncHandler(async (req: Request, res: Response) => {
    const imageId = parseInt(req.params.imageId);
    const annotations = await this.annotationService.getImageAnnotations(
      imageId,
      req.user.id,
    );

    res.status(200).json({
      status: "success",
      message: "Image annotations retrieved successfully",
      data: annotations,
    });
  });

  updateAnnotation = asyncHandler(async (req: Request, res: Response) => {
    const annotationId = parseInt(req.params.annotationId);
    const updateData: AnnotationUpdateDTO = req.body;
    const annotation = await this.annotationService.updateAnnotation(
      annotationId,
      req.user.id,
      updateData,
    );

    res.status(200).json({
      status: "success",
      message: "Annotation updated successfully",
      data: annotation,
    });
  });

  deleteAnnotation = asyncHandler(async (req: Request, res: Response) => {
    const annotationId = parseInt(req.params.annotationId);
    await this.annotationService.deleteAnnotation(annotationId, req.user.id);

    res.status(200).json({
      status: "success",
      message: "Annotation deleted successfully",
      data: null,
    });
  });

  batchCreateAnnotations = asyncHandler(async (req: Request, res: Response) => {
    const batchData: BatchAnnotationDTO = req.body;
    const annotations = await this.annotationService.batchCreateAnnotations(
      req.user.id,
      batchData,
    );

    res.status(201).json({
      status: "success",
      message: `${annotations.length} annotations created successfully`,
      data: annotations,
    });
  });
}
