import { Request, Response } from "express";
import pool from "../config/database";
import { Annotation } from "../types";

interface AuthRequest extends Request {
  user?: { user_id: number; username: string };
}

export const addAnnotation = async (req: AuthRequest, res: Response) => {
  const { project_id, image_id } = req.params;
  const { class_id, annotation_data } = req.body;
  if (!class_id || !annotation_data)
    return res
      .status(400)
      .json({ error: "Class ID and annotation data required" });

  try {
    const [image] = await pool.query(
      "SELECT * FROM Images WHERE image_id = ? AND project_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [image_id, project_id, req.user!.user_id],
    );
    if ((image as any[]).length === 0)
      return res.status(404).json({ error: "Image not found" });

    const [classCheck] = await pool.query(
      "SELECT * FROM Classes WHERE class_id = ? AND project_id = ?",
      [class_id, project_id],
    );
    if ((classCheck as any[]).length === 0)
      return res.status(404).json({ error: "Class not found" });

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
  const { project_id, image_id } = req.params;

  try {
    const [annotations] = await pool.query(
      "SELECT * FROM Annotations WHERE image_id = ? AND image_id IN (SELECT image_id FROM Images WHERE project_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)))",
      [image_id, project_id, req.user!.user_id],
    );
    res.status(200).json(annotations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
