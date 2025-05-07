import { IAnnotationService } from "../IAnnotationService";
import { IAnnotationRepository } from "../../repositories/IAnnotationRepository";
import { IImageRepository } from "../../repositories/IImageRepository";
import { IProjectRepository } from "../../repositories/IProjectRepository";
import {
  AnnotationCreateDTO,
  AnnotationResponseDTO,
  AnnotationUpdateDTO,
  BatchAnnotationDTO,
} from "../../dtos/annotation.dto";
import { NotFoundError } from "../../../exceptions/NotFoundError";
import { InvalidRequestError } from "../../../exceptions/InvalidRequestError";

export class AnnotationService implements IAnnotationService {
  constructor(
    private annotationRepository: IAnnotationRepository,
    private imageRepository: IImageRepository,
    private projectRepository: IProjectRepository,
  ) {}

  async createAnnotation(
    userId: number,
    annotationData: AnnotationCreateDTO,
  ): Promise<AnnotationResponseDTO> {
    // Get image to verify project ownership
    const image = await this.imageRepository.findById(annotationData.imageId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(image.project_id, userId);

    // Create annotation
    const annotation = await this.annotationRepository.create({
      image_id: annotationData.imageId,
      class_id: annotationData.classId,
      annotation_data: annotationData.data,
    });

    // Mark image as annotated if not already
    if (image.status === "uploaded") {
      await this.imageRepository.updateStatus(image.image_id, "annotated");
    }

    // Get complete annotation with class info
    const createdAnnotation = await this.annotationRepository.findById(
      annotation.annotation_id,
    );

    return this.mapToAnnotationResponseDTO(createdAnnotation);
  }

  async getImageAnnotations(
    imageId: number,
    userId: number,
  ): Promise<AnnotationResponseDTO[]> {
    // Get image to verify project ownership
    const image = await this.imageRepository.findById(imageId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(image.project_id, userId);

    // Get annotations
    const annotations = await this.annotationRepository.findByImageId(imageId);

    return annotations.map((annotation) =>
      this.mapToAnnotationResponseDTO(annotation),
    );
  }

  async updateAnnotation(
    annotationId: number,
    userId: number,
    data: AnnotationUpdateDTO,
  ): Promise<AnnotationResponseDTO> {
    // Get annotation
    const existingAnnotation = await this.annotationRepository.findById(
      annotationId,
    );

    // Get image to verify project ownership
    const image = await this.imageRepository.findById(
      existingAnnotation.image_id,
    );

    // Verify project ownership
    await this.projectRepository.verifyOwnership(image.project_id, userId);

    // Update annotation
    const updatedAnnotation = await this.annotationRepository.update(
      annotationId,
      {
        class_id: data.classId,
        annotation_data: data.data,
        is_valid: data.isValid,
      },
    );

    return this.mapToAnnotationResponseDTO(updatedAnnotation);
  }

  async deleteAnnotation(annotationId: number, userId: number): Promise<void> {
    // Get annotation
    const annotation = await this.annotationRepository.findById(annotationId);

    // Get image to verify project ownership
    const image = await this.imageRepository.findById(annotation.image_id);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(image.project_id, userId);

    // Delete annotation
    await this.annotationRepository.delete(annotationId);

    // Check if image has other annotations
    const remainingAnnotations = await this.annotationRepository.findByImageId(
      image.image_id,
    );

    // If no annotations, mark image as uploaded
    if (remainingAnnotations.length === 0 && image.status === "annotated") {
      await this.imageRepository.updateStatus(image.image_id, "uploaded");
    }
  }

  async batchCreateAnnotations(
    userId: number,
    data: BatchAnnotationDTO,
  ): Promise<AnnotationResponseDTO[]> {
    if (!data.annotations || data.annotations.length === 0) {
      throw new InvalidRequestError("No annotations provided");
    }

    // Get image to verify project ownership
    const image = await this.imageRepository.findById(data.imageId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(image.project_id, userId);

    // Create annotations
    const createdAnnotations: AnnotationResponseDTO[] = [];

    for (const item of data.annotations) {
      const annotation = await this.createAnnotation(userId, {
        imageId: data.imageId,
        classId: item.classId,
        data: item.data,
      });

      createdAnnotations.push(annotation);
    }

    // Mark image as annotated if not already
    if (image.status === "uploaded") {
      await this.imageRepository.updateStatus(image.image_id, "annotated");
    }

    return createdAnnotations;
  }

  private mapToAnnotationResponseDTO(annotation: any): AnnotationResponseDTO {
    return {
      id: annotation.annotation_id,
      imageId: annotation.image_id,
      classId: annotation.class_id,
      className: annotation.Class?.name || "",
      classColor: annotation.Class?.color || "#000000",
      data: annotation.annotation_data,
      createdAt: annotation.created_at.toISOString(),
      isValid: annotation.is_valid,
    };
  }
}
