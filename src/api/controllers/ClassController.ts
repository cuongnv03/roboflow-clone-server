import { Request, Response } from "express";
import { IClassService } from "../../domain/services/IClassService";
import { ClassCreateDTO, ClassUpdateDTO } from "../../domain/dtos/class.dto";
import { asyncHandler } from "../middlewares/asyncHandler";

export class ClassController {
  constructor(private classService: IClassService) {}

  createClass = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const classData: ClassCreateDTO = req.body;
    const projectClass = await this.classService.createClass(
      projectId,
      req.user.id,
      classData,
    );

    res.status(201).json({
      status: "success",
      message: "Class created successfully",
      data: projectClass,
    });
  });

  getProjectClasses = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const classes = await this.classService.getClassesByProject(
      projectId,
      req.user.id,
    );

    res.status(200).json({
      status: "success",
      message: "Project classes retrieved successfully",
      data: classes,
    });
  });

  updateClass = asyncHandler(async (req: Request, res: Response) => {
    const classId = parseInt(req.params.classId);
    const updateData: ClassUpdateDTO = req.body;
    const updatedClass = await this.classService.updateClass(
      classId,
      req.user.id,
      updateData,
    );

    res.status(200).json({
      status: "success",
      message: "Class updated successfully",
      data: updatedClass,
    });
  });

  deleteClass = asyncHandler(async (req: Request, res: Response) => {
    const classId = parseInt(req.params.classId);
    await this.classService.deleteClass(classId, req.user.id);

    res.status(200).json({
      status: "success",
      message: "Class deleted successfully",
      data: null,
    });
  });
}
