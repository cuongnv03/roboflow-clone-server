import { Request, Response } from "express";
import pool from "../config/database";
import { Annotation } from "../types";

interface AuthRequest extends Request {
  user?: { user_id: number; username: string };
}

export const addAnnotation = async (req: AuthRequest, res: Response) => {
  const { image_id } = req.params;
  const { class_id, annotation_data } = req.body;
  if (!class_id || !annotation_data) {
    return res
      .status(400)
      .json({ error: "Class ID and annotation data required" });
  }

  try {
    const [image] = await pool.query(
      "SELECT * FROM Images WHERE image_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [image_id, req.user!.user_id],
    );
    if ((image as any[]).length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    const project_id = (image as any[])[0].project_id;
    const [classCheck] = await pool.query(
      "SELECT * FROM Classes WHERE class_id = ? AND project_id = ?",
      [class_id, project_id],
    );
    if ((classCheck as any[]).length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }

    const [result] = await pool.query(
      "INSERT INTO Annotations (image_id, class_id, annotation_data, created_by) VALUES (?, ?, ?, ?)",
      [image_id, class_id, JSON.stringify(annotation_data), req.user!.user_id],
    );

    const annotation: Annotation = {
      annotation_id: (result as any).insertId,
      image_id: Number(image_id),
      class_id,
      annotation_data,
      created_at: new Date().toISOString(),
      created_by: req.user!.user_id,
      is_valid: true,
    };

    res.status(201).json(annotation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAnnotations = async (req: AuthRequest, res: Response) => {
  const { image_id } = req.params;
  try {
    const [annotations] = await pool.query(
      "SELECT * FROM Annotations WHERE image_id = ? AND image_id IN (SELECT image_id FROM Images WHERE project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)))",
      [image_id, req.user!.user_id],
    );
    res.status(200).json(annotations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAnnotationById = async (req: AuthRequest, res: Response) => {
  const { image_id, annotation_id } = req.params;
  try {
    const [annotation] = await pool.query(
      "SELECT * FROM Annotations WHERE annotation_id = ? AND image_id = ? AND image_id IN (SELECT image_id FROM Images WHERE project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)))",
      [annotation_id, image_id, req.user!.user_id],
    );
    if ((annotation as any[]).length === 0) {
      return res.status(404).json({ error: "Annotation not found" });
    }
    res.status(200).json((annotation as any[])[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateAnnotation = async (req: AuthRequest, res: Response) => {
  const { image_id, annotation_id } = req.params;
  const { class_id, annotation_data, is_valid } = req.body;
  try {
    const [annotation] = await pool.query(
      "SELECT * FROM Annotations WHERE annotation_id = ? AND image_id = ? AND image_id IN (SELECT image_id FROM Images WHERE project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)))",
      [annotation_id, image_id, req.user!.user_id],
    );
    if ((annotation as any[]).length === 0) {
      return res.status(404).json({ error: "Annotation not found" });
    }
    await pool.query(
      "UPDATE Annotations SET class_id = ?, annotation_data = ?, is_valid = ? WHERE annotation_id = ?",
      [
        class_id || (annotation as any[])[0].class_id,
        annotation_data
          ? JSON.stringify(annotation_data)
          : (annotation as any[])[0].annotation_data,
        is_valid !== undefined ? is_valid : (annotation as any[])[0].is_valid,
        annotation_id,
      ],
    );
    res.status(200).json({ message: "Annotation updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteAnnotation = async (req: AuthRequest, res: Response) => {
  const { image_id, annotation_id } = req.params;
  try {
    const [annotation] = await pool.query(
      "SELECT * FROM Annotations WHERE annotation_id = ? AND image_id = ? AND image_id IN (SELECT image_id FROM Images WHERE project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)))",
      [annotation_id, image_id, req.user!.user_id],
    );
    if ((annotation as any[]).length === 0) {
      return res.status(404).json({ error: "Annotation not found" });
    }
    await pool.query("DELETE FROM Annotations WHERE annotation_id = ?", [
      annotation_id,
    ]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
