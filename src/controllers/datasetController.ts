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
    if ((project as any[]).length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

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
    if ((dataset as any[]).length === 0) {
      return res.status(404).json({ error: "Dataset not found" });
    }

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

export const getDatasetById = async (req: AuthRequest, res: Response) => {
  const { dataset_id } = req.params;
  try {
    const [dataset] = await pool.query(
      "SELECT * FROM Datasets WHERE dataset_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [dataset_id, req.user!.user_id],
    );
    if ((dataset as any[]).length === 0) {
      return res.status(404).json({ error: "Dataset not found" });
    }
    res.status(200).json((dataset as any[])[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateDataset = async (req: AuthRequest, res: Response) => {
  const { dataset_id } = req.params;
  const { name, preprocessing_settings, augmentation_settings } = req.body;
  try {
    const [dataset] = await pool.query(
      "SELECT * FROM Datasets WHERE dataset_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [dataset_id, req.user!.user_id],
    );
    if ((dataset as any[]).length === 0) {
      return res.status(404).json({ error: "Dataset not found" });
    }
    await pool.query(
      "UPDATE Datasets SET name = ?, preprocessing_settings = ?, augmentation_settings = ? WHERE dataset_id = ?",
      [
        name || (dataset as any[])[0].name,
        preprocessing_settings
          ? JSON.stringify(preprocessing_settings)
          : (dataset as any[])[0].preprocessing_settings,
        augmentation_settings
          ? JSON.stringify(augmentation_settings)
          : (dataset as any[])[0].augmentation_settings,
        dataset_id,
      ],
    );
    res.status(200).json({ message: "Dataset updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteDataset = async (req: AuthRequest, res: Response) => {
  const { dataset_id } = req.params;
  try {
    const [dataset] = await pool.query(
      "SELECT * FROM Datasets WHERE dataset_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [dataset_id, req.user!.user_id],
    );
    if ((dataset as any[]).length === 0) {
      return res.status(404).json({ error: "Dataset not found" });
    }
    await pool.query("DELETE FROM Datasets WHERE dataset_id = ?", [dataset_id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getDatasetImages = async (req: AuthRequest, res: Response) => {
  const { dataset_id } = req.params;
  try {
    const [images] = await pool.query(
      "SELECT * FROM Dataset_Images WHERE dataset_id = ? AND dataset_id IN (SELECT dataset_id FROM Datasets WHERE project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)))",
      [dataset_id, req.user!.user_id],
    );
    res.status(200).json(images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const addImageToDataset = async (req: AuthRequest, res: Response) => {
  const { dataset_id } = req.params;
  const { image_id, split } = req.body;
  if (!image_id || !split) {
    return res.status(400).json({ error: "Image ID and split required" });
  }
  try {
    const [dataset] = await pool.query(
      "SELECT * FROM Datasets WHERE dataset_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [dataset_id, req.user!.user_id],
    );
    if ((dataset as any[]).length === 0) {
      return res.status(404).json({ error: "Dataset not found" });
    }
    const [image] = await pool.query(
      "SELECT * FROM Images WHERE image_id = ? AND project_id = (SELECT project_id FROM Datasets WHERE dataset_id = ?)",
      [image_id, dataset_id],
    );
    if ((image as any[]).length === 0) {
      return res.status(404).json({ error: "Image not found in project" });
    }
    await pool.query(
      "INSERT INTO Dataset_Images (dataset_id, image_id, split) VALUES (?, ?, ?)",
      [dataset_id, image_id, split],
    );
    res.status(201).json({ message: "Image added to dataset" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const removeImageFromDataset = async (
  req: AuthRequest,
  res: Response,
) => {
  const { dataset_id, image_id } = req.params;
  try {
    const [dataset] = await pool.query(
      "SELECT * FROM Datasets WHERE dataset_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [dataset_id, req.user!.user_id],
    );
    if ((dataset as any[]).length === 0) {
      return res.status(404).json({ error: "Dataset not found" });
    }
    await pool.query(
      "DELETE FROM Dataset_Images WHERE dataset_id = ? AND image_id = ?",
      [dataset_id, image_id],
    );
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const generateDataset = async (req: AuthRequest, res: Response) => {
  const { dataset_id } = req.params;
  try {
    const [dataset] = await pool.query(
      "SELECT * FROM Datasets WHERE dataset_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [dataset_id, req.user!.user_id],
    );
    if ((dataset as any[]).length === 0) {
      return res.status(404).json({ error: "Dataset not found" });
    }
    await pool.query(
      "UPDATE Datasets SET status = 'generating' WHERE dataset_id = ?",
      [dataset_id],
    );
    res.status(202).json({ message: "Dataset generation started" });
    // Implement actual generation logic here (e.g., background job)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
