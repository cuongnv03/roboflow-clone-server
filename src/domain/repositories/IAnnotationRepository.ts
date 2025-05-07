import Annotation, {
  AnnotationCreationAttributes,
} from "../../database/models/Annotation";

export interface IAnnotationRepository {
  create(annotationData: AnnotationCreationAttributes): Promise<Annotation>;
  findById(annotationId: number): Promise<Annotation>;
  findByImageId(imageId: number): Promise<Annotation[]>;
  update(
    annotationId: number,
    data: Partial<AnnotationCreationAttributes>,
  ): Promise<Annotation>;
  delete(annotationId: number): Promise<void>;
  deleteByImageId(imageId: number): Promise<void>;
}
