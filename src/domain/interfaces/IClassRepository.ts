import Class, { ClassCreationAttributes } from "../../database/models/Class";

export interface IClassRepository {
  create(
    projectId: number,
    classData: Omit<ClassCreationAttributes, "project_id">,
  ): Promise<Class>;
  findById(classId: number): Promise<Class>;
  findByProjectId(projectId: number): Promise<Class[]>;
  update(
    classId: number,
    data: Partial<Omit<ClassCreationAttributes, "project_id">>,
  ): Promise<Class>;
  delete(classId: number): Promise<void>;
  verifyClassBelongsToProject(
    classId: number,
    projectId: number,
  ): Promise<boolean>;
}
