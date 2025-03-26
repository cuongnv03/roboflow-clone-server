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
    if ((project as any[]).length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

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

export const getClassById = async (req: AuthRequest, res: Response) => {
  const { project_id, class_id } = req.params;
  try {
    const [classObj] = await pool.query(
      "SELECT * FROM Classes WHERE class_id = ? AND project_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [class_id, project_id, req.user!.user_id],
    );
    if ((classObj as any[]).length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }
    res.status(200).json((classObj as any[])[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateClass = async (req: AuthRequest, res: Response) => {
  const { project_id, class_id } = req.params;
  const { name, color } = req.body;
  try {
    const [classObj] = await pool.query(
      "SELECT * FROM Classes WHERE class_id = ? AND project_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [class_id, project_id, req.user!.user_id],
    );
    if ((classObj as any[]).length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }
    await pool.query(
      "UPDATE Classes SET name = ?, color = ? WHERE class_id = ?",
      [
        name || (classObj as any[])[0].name,
        color || (classObj as any[])[0].color,
        class_id,
      ],
    );
    res.status(200).json({ message: "Class updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteClass = async (req: AuthRequest, res: Response) => {
  const { project_id, class_id } = req.params;
  try {
    const [classObj] = await pool.query(
      "SELECT * FROM Classes WHERE class_id = ? AND project_id = ? AND project_id IN (SELECT project_id FROM Projects WHERE workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?))",
      [class_id, project_id, req.user!.user_id],
    );
    if ((classObj as any[]).length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }
    await pool.query("DELETE FROM Classes WHERE class_id = ?", [class_id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
