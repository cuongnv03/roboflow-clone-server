import {
  AnnotationCreateDTO,
  AnnotationResponseDTO,
  AnnotationUpdateDTO,
  BatchAnnotationDTO,
} from "../dtos/annotation.dto";

export interface IAnnotationService {
  createAnnotation(
    userId: number,
    annotationData: AnnotationCreateDTO,
  ): Promise<AnnotationResponseDTO>;
  getImageAnnotations(
    imageId: number,
    userId: number,
  ): Promise<AnnotationResponseDTO[]>;
  updateAnnotation(
    annotationId: number,
    userId: number,
    data: AnnotationUpdateDTO,
  ): Promise<AnnotationResponseDTO>;
  deleteAnnotation(annotationId: number, userId: number): Promise<void>;
  batchCreateAnnotations(
    userId: number,
    data: BatchAnnotationDTO,
  ): Promise<AnnotationResponseDTO[]>;
}
