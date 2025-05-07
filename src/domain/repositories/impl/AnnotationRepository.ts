import { IAnnotationRepository } from "../IAnnotationRepository";
import Annotation, {
  AnnotationCreationAttributes,
} from "../../../database/models/Annotation";
import { NotFoundError } from "../../../exceptions/NotFoundError";
import Class from "../../../database/models/Class";

export class AnnotationRepository implements IAnnotationRepository {
  async create(
    annotationData: AnnotationCreationAttributes,
  ): Promise<Annotation> {
    return Annotation.create(annotationData);
  }

  async findById(annotationId: number): Promise<Annotation> {
    const annotation = await Annotation.findByPk(annotationId, {
      include: [{ model: Class, attributes: ["name", "color"] }],
    });

    if (!annotation) {
      throw new NotFoundError("Annotation not found");
    }

    return annotation;
  }

  async findByImageId(imageId: number): Promise<Annotation[]> {
    return Annotation.findAll({
      where: { image_id: imageId },
      include: [{ model: Class, attributes: ["name", "color"] }],
      order: [["created_at", "DESC"]],
    });
  }

  async update(
    annotationId: number,
    data: Partial<AnnotationCreationAttributes>,
  ): Promise<Annotation> {
    const annotation = await Annotation.findByPk(annotationId);

    if (!annotation) {
      throw new NotFoundError("Annotation not found");
    }

    await annotation.update(data);

    return this.findById(annotationId); // Return with Class included
  }

  async delete(annotationId: number): Promise<void> {
    const annotation = await Annotation.findByPk(annotationId);

    if (!annotation) {
      throw new NotFoundError("Annotation not found");
    }

    await annotation.destroy();
  }

  async deleteByImageId(imageId: number): Promise<void> {
    await Annotation.destroy({
      where: { image_id: imageId },
    });
  }
}
