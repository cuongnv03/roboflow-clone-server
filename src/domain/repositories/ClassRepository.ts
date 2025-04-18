import { IClassRepository } from "../interfaces/IClassRepository";
import Class, { ClassCreationAttributes } from "../../database/models/Class";
import { NotFoundError } from "../../exceptions/NotFoundError";

export class ClassRepository implements IClassRepository {
  async create(
    projectId: number,
    classData: Omit<ClassCreationAttributes, "project_id">,
  ): Promise<Class> {
    return Class.create({
      ...classData,
      project_id: projectId,
    });
  }

  async findById(classId: number): Promise<Class> {
    const classItem = await Class.findByPk(classId);
    if (!classItem) {
      throw new NotFoundError("Class not found");
    }
    return classItem;
  }

  async findByProjectId(projectId: number): Promise<Class[]> {
    return Class.findAll({
      where: { project_id: projectId },
      order: [["name", "ASC"]],
    });
  }

  async update(
    classId: number,
    data: Partial<Omit<ClassCreationAttributes, "project_id">>,
  ): Promise<Class> {
    const classItem = await Class.findByPk(classId);
    if (!classItem) {
      throw new NotFoundError("Class not found");
    }

    await classItem.update(data);
    return classItem;
  }

  async delete(classId: number): Promise<void> {
    const classItem = await Class.findByPk(classId);
    if (!classItem) {
      throw new NotFoundError("Class not found");
    }

    await classItem.destroy();
  }

  async verifyClassBelongsToProject(
    classId: number,
    projectId: number,
  ): Promise<boolean> {
    const classItem = await Class.findOne({
      where: { class_id: classId, project_id: projectId },
    });

    if (!classItem) {
      throw new NotFoundError("Class not found in this project");
    }

    return true;
  }
}
