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
    if ((workspace as any[]).length === 0) {
      return res.status(404).json({ error: "Workspace not found" });
    }

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

export const getProjectById = async (req: AuthRequest, res: Response) => {
  const { project_id } = req.params;
  try {
    const [project] = await pool.query(
      "SELECT * FROM Projects WHERE project_id = ? AND workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)",
      [project_id, req.user!.user_id],
    );
    if ((project as any[]).length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.status(200).json((project as any[])[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  const { project_id } = req.params;
  const { name, description, type } = req.body;
  try {
    const [project] = await pool.query(
      "SELECT * FROM Projects WHERE project_id = ? AND workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)",
      [project_id, req.user!.user_id],
    );
    if ((project as any[]).length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    await pool.query(
      "UPDATE Projects SET name = ?, description = ?, type = ? WHERE project_id = ?",
      [
        name || (project as any[])[0].name,
        description || (project as any[])[0].description,
        type || (project as any[])[0].type,
        project_id,
      ],
    );
    res.status(200).json({ message: "Project updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  const { project_id } = req.params;
  try {
    const [project] = await pool.query(
      "SELECT * FROM Projects WHERE project_id = ? AND workspace_id IN (SELECT workspace_id FROM Workspaces WHERE owner_id = ?)",
      [project_id, req.user!.user_id],
    );
    if ((project as any[]).length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    await pool.query("DELETE FROM Projects WHERE project_id = ?", [project_id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
