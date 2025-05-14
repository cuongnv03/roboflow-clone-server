import { Request, Response } from "express";
import { IDatasetService } from "../../domain/services/IDatasetService";
import { IExportService } from "../../domain/services/IExportService";
import {
  DatasetCreateDTO,
  DatasetSplitDTO,
  DatasetImageAssignDTO,
  DatasetExportOptionsDTO,
} from "../../domain/dtos/dataset.dto";
import { asyncHandler } from "../middlewares/asyncHandler";

export class DatasetController {
  constructor(
    private datasetService: IDatasetService,
    private exportService: IExportService,
  ) {}

  createDataset = asyncHandler(async (req: Request, res: Response) => {
    const datasetData: DatasetCreateDTO = req.body;
    const dataset = await this.datasetService.createDataset(
      req.user.id,
      datasetData,
    );

    res.status(201).json({
      status: "success",
      message: "Dataset created successfully",
      data: dataset,
    });
  });

  getDataset = asyncHandler(async (req: Request, res: Response) => {
    const datasetId = parseInt(req.params.datasetId);
    const dataset = await this.datasetService.getDataset(
      datasetId,
      req.user.id,
    );

    res.status(200).json({
      status: "success",
      message: "Dataset retrieved successfully",
      data: dataset,
    });
  });

  getProjectDatasets = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const datasets = await this.datasetService.getProjectDatasets(
      projectId,
      req.user.id,
    );

    res.status(200).json({
      status: "success",
      message: "Project datasets retrieved successfully",
      data: datasets,
    });
  });

  deleteDataset = asyncHandler(async (req: Request, res: Response) => {
    const datasetId = parseInt(req.params.datasetId);
    await this.datasetService.deleteDataset(datasetId, req.user.id);

    res.status(200).json({
      status: "success",
      message: "Dataset deleted successfully",
      data: null,
    });
  });

  generateSplit = asyncHandler(async (req: Request, res: Response) => {
    const datasetId = parseInt(req.params.datasetId);
    const splitConfig: DatasetSplitDTO = req.body;
    const dataset = await this.datasetService.generateSplit(
      datasetId,
      req.user.id,
      splitConfig,
    );

    res.status(200).json({
      status: "success",
      message: "Dataset split generated successfully",
      data: dataset,
    });
  });

  assignImagesToSplit = asyncHandler(async (req: Request, res: Response) => {
    const datasetId = parseInt(req.params.datasetId);
    const assignData: DatasetImageAssignDTO = req.body;
    const dataset = await this.datasetService.assignImagesToSplit(
      datasetId,
      req.user.id,
      assignData,
    );

    res.status(200).json({
      status: "success",
      message: "Images assigned to split successfully",
      data: dataset,
    });
  });

  getDatasetImages = asyncHandler(async (req: Request, res: Response) => {
    const datasetId = parseInt(req.params.datasetId);
    const split = req.query.split as DatasetSplit | undefined;

    try {
      const images = await this.datasetService.getDatasetImages(
        datasetId,
        req.user.id,
        split,
      );

      res.status(200).json({
        status: "success",
        message: "Dataset images retrieved successfully",
        data: images,
      });
    } catch (error) {
      // Trả về error 400 thay vì 500 để frontend có thể hiển thị thông báo
      res.status(400).json({
        status: "error",
        message: error.message || "Failed to retrieve dataset images",
      });
    }
  });

  getExportFormats = asyncHandler(async (req: Request, res: Response) => {
    const projectType = req.query.projectType as string;
    const formats = await this.exportService.getExportFormats(projectType);

    res.status(200).json({
      status: "success",
      message: "Export formats retrieved successfully",
      data: formats,
    });
  });

  exportDataset = asyncHandler(async (req: Request, res: Response) => {
    const datasetId = parseInt(req.params.datasetId);
    const options: DatasetExportOptionsDTO = req.body;
    const result = await this.exportService.exportDataset(
      datasetId,
      req.user.id,
      options,
    );

    res.status(200).json({
      status: "success",
      message: "Dataset exported successfully",
      data: result,
    });
  });

  generateExportPreview = asyncHandler(async (req: Request, res: Response) => {
    const datasetId = parseInt(req.params.datasetId);
    const format = req.query.format as string;
    const preview = await this.exportService.generateExportPreview(
      datasetId,
      req.user.id,
      format,
    );

    res.status(200).json({
      status: "success",
      message: "Export preview generated successfully",
      data: preview,
    });
  });
}
