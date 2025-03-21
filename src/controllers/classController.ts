import { Request, Response } from "express";
import pool from "../config/database";
import { Class } from "../types";

interface AuthRequest extends Request {
  user?: { user_id: number; username: string };
}

export const addClass = async (req: AuthRequest, res: Response) => {
  const { project_id } = req.params;
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });

  try {
    const [project] = await pool.query(
      "SELECT * FROM Projects WHERE project_id = ? AND workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)",
      [project_id, req.user!.user_id],
    );
    if ((project as any[]).length === 0)
      return res.status(404).json({ error: "Project not found" });

    const [result] = await pool.query(
      "INSERT INTO Classes (project_id, name, color) VALUES (?, ?, ?)",
      [project_id, name, color || "#000000"],
    );

    const classObj: Class = {
      class_id: (result as any).insertId,
      project_id: Number(project_id),
      name,
      color: color || "#000000",
      created_at: new Date().toISOString(),
    };

    res.status(201).json(classObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getClasses = async (req: AuthRequest, res: Response) => {
  const { project_id } = req.params;

  try {
    const [classes] = await pool.query(
      "SELECT * FROM Classes WHERE project_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [project_id, req.user!.user_id],
    );
    res.status(200).json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
