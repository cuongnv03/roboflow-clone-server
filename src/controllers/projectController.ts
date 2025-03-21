import { Request, Response } from "express";
import pool from "../config/database";
import { Project } from "../types";

interface AuthRequest extends Request {
  user?: { user_id: number; username: string };
}

export const createProject = async (req: AuthRequest, res: Response) => {
  const { workspace_id } = req.params;
  const { name, description, type } = req.body;
  if (!name || !type)
    return res.status(400).json({ error: "Name and type required" });

  try {
    const [workspace] = await pool.query(
      "SELECT * FROM Workspaces WHERE workspace_id = ? AND owner_id = ?",
      [workspace_id, req.user!.user_id],
    );
    if ((workspace as any[]).length === 0)
      return res.status(404).json({ error: "Workspace not found" });

    const [result] = await pool.query(
      "INSERT INTO Projects (workspace_id, name, description, type) VALUES (?, ?, ?, ?)",
      [workspace_id, name, description, type],
    );

    const project: Project = {
      project_id: (result as any).insertId,
      workspace_id: Number(workspace_id),
      name,
      description,
      type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  const { workspace_id } = req.params;

  try {
    const [projects] = await pool.query(
      "SELECT * FROM Projects WHERE workspace_id = ? AND workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)",
      [workspace_id, req.user!.user_id],
    );
    res.status(200).json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
