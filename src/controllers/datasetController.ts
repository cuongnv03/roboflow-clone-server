import { Request, Response } from "express";
import pool from "../config/database";
import { Dataset, DatasetImage } from "../types";

interface AuthRequest extends Request {
  user?: { user_id: number; username: string };
}

export const createDataset = async (req: AuthRequest, res: Response) => {
  const { project_id } = req.params;
  const { name, preprocessing_settings, augmentation_settings, images } =
    req.body;
  if (!name || !images)
    return res.status(400).json({ error: "Name and images required" });

  try {
    const [project] = await pool.query(
      "SELECT * FROM Projects WHERE project_id = ? AND workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)",
      [project_id, req.user!.user_id],
    );
    if ((project as any[]).length === 0)
      return res.status(404).json({ error: "Project not found" });

    const [result] = await pool.query(
      "INSERT INTO Datasets (project_id, name, preprocessing_settings, augmentation_settings) VALUES (?, ?, ?, ?)",
      [
        project_id,
        name,
        JSON.stringify(preprocessing_settings),
        JSON.stringify(augmentation_settings),
      ],
    );
    const datasetId = (result as any).insertId;

    for (const img of images) {
      await pool.query(
        "INSERT INTO Dataset_Images (dataset_id, image_id, split) VALUES (?, ?, ?)",
        [datasetId, img.image_id, img.split],
      );
    }

    const dataset: Dataset = {
      dataset_id: datasetId,
      project_id: Number(project_id),
      name,
      created_date: new Date().toISOString(),
      preprocessing_settings,
      augmentation_settings,
      status: "pending",
    };

    res.status(201).json(dataset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getDatasets = async (req: AuthRequest, res: Response) => {
  const { project_id } = req.params;

  try {
    const [datasets] = await pool.query(
      "SELECT * FROM Datasets WHERE project_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [project_id, req.user!.user_id],
    );
    res.status(200).json(datasets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getDatasetDetails = async (req: AuthRequest, res: Response) => {
  const { project_id, dataset_id } = req.params;

  try {
    const [dataset] = await pool.query(
      "SELECT * FROM Datasets WHERE dataset_id = ? AND project_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [dataset_id, project_id, req.user!.user_id],
    );
    if ((dataset as any[]).length === 0)
      return res.status(404).json({ error: "Dataset not found" });

    const [images] = await pool.query(
      "SELECT * FROM Dataset_Images WHERE dataset_id = ?",
      [dataset_id],
    );
    const datasetDetail = { ...(dataset as any)[0], images };

    res.status(200).json(datasetDetail);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
