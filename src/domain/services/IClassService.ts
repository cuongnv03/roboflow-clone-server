import {
  ClassCreateDTO,
  ClassResponseDTO,
  ClassUpdateDTO,
} from "../dtos/class.dto";

export interface IClassService {
  createClass(
    projectId: number,
    userId: number,
    classData: ClassCreateDTO,
  ): Promise<ClassResponseDTO>;
  getClassesByProject(
    projectId: number,
    userId: number,
  ): Promise<ClassResponseDTO[]>;
  updateClass(
    classId: number,
    userId: number,
    data: ClassUpdateDTO,
  ): Promise<ClassResponseDTO>;
  deleteClass(classId: number, userId: number): Promise<void>;
}
