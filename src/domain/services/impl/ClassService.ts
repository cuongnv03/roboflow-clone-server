import { IClassService } from "../IClassService";
import { IClassRepository } from "../../repositories/IClassRepository";
import { IProjectRepository } from "../../repositories/IProjectRepository";
import {
  ClassCreateDTO,
  ClassResponseDTO,
  ClassUpdateDTO,
} from "../../dtos/class.dto";
import Class from "../../../database/models/Class";

export class ClassService implements IClassService {
  constructor(
    private classRepository: IClassRepository,
    private projectRepository: IProjectRepository,
  ) {}

  async createClass(
    projectId: number,
    userId: number,
    classData: ClassCreateDTO,
  ): Promise<ClassResponseDTO> {
    // Verify project ownership
    await this.projectRepository.verifyOwnership(projectId, userId);
    const projectClass = await this.classRepository.create(
      projectId,
      classData,
    );
    return this.mapToClassResponseDTO(projectClass);
  }

  async getClassesByProject(
    projectId: number,
    userId: number,
  ): Promise<ClassResponseDTO[]> {
    // Verify project ownership
    await this.projectRepository.verifyOwnership(projectId, userId);
    const classes = await this.classRepository.findByProjectId(projectId);
    return classes.map((classItem) => this.mapToClassResponseDTO(classItem));
  }

  async updateClass(
    classId: number,
    userId: number,
    data: ClassUpdateDTO,
  ): Promise<ClassResponseDTO> {
    const classItem = await this.classRepository.findById(classId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(classItem.project_id, userId);

    const updatedClass = await this.classRepository.update(classId, data);
    return this.mapToClassResponseDTO(updatedClass);
  }

  async deleteClass(classId: number, userId: number): Promise<void> {
    const classItem = await this.classRepository.findById(classId);

    // Verify project ownership
    await this.projectRepository.verifyOwnership(classItem.project_id, userId);

    await this.classRepository.delete(classId);
  }

  // Helper method to map Class model to DTO
  private mapToClassResponseDTO(classItem: Class): ClassResponseDTO {
    return {
      id: classItem.class_id,
      projectId: classItem.project_id,
      name: classItem.name,
      color: classItem.color,
      createdAt: classItem.created_at.toISOString(),
    };
  }
}
