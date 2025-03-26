import { Request, Response } from "express";
import pool from "../config/database";
import { Workspace } from "../types";

interface AuthRequest extends Request {
  user?: { user_id: number; username: string };
}

export const createWorkspace = async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });

  try {
    const [result] = await pool.query(
      "INSERT INTO Workspaces (name, owner_id, description) VALUES (?, ?, ?)",
      [name, req.user!.user_id, description],
    );

    const workspace: Workspace = {
      workspace_id: (result as any).insertId,
      name,
      owner_id: req.user!.user_id,
      created_at: new Date().toISOString(),
      description,
    };

    res.status(201).json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getWorkspaces = async (req: AuthRequest, res: Response) => {
  try {
    const [workspaces] = await pool.query(
      "SELECT * FROM Workspaces WHERE owner_id = ?",
      [req.user!.user_id],
    );
    res.status(200).json(workspaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getWorkspaceById = async (req: AuthRequest, res: Response) => {
  const { workspace_id } = req.params;
  try {
    const [workspace] = await pool.query(
      "SELECT * FROM Workspaces WHERE workspace_id = ? AND owner_id = ?",
      [workspace_id, req.user!.user_id],
    );
    if ((workspace as any[]).length === 0) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    res.status(200).json((workspace as any[])[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateWorkspace = async (req: AuthRequest, res: Response) => {
  const { workspace_id } = req.params;
  const { name, description } = req.body;
  try {
    const [workspace] = await pool.query(
      "SELECT * FROM Workspaces WHERE workspace_id = ? AND owner_id = ?",
      [workspace_id, req.user!.user_id],
    );
    if ((workspace as any[]).length === 0) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    await pool.query(
      "UPDATE Workspaces SET name = ?, description = ? WHERE workspace_id = ?",
      [
        name || (workspace as any[])[0].name,
        description || (workspace as any[])[0].description,
        workspace_id,
      ],
    );
    res.status(200).json({ message: "Workspace updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteWorkspace = async (req: AuthRequest, res: Response) => {
  const { workspace_id } = req.params;
  try {
    const [workspace] = await pool.query(
      "SELECT * FROM Workspaces WHERE workspace_id = ? AND owner_id = ?",
      [workspace_id, req.user!.user_id],
    );
    if ((workspace as any[]).length === 0) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    await pool.query("DELETE FROM Workspaces WHERE workspace_id = ?", [
      workspace_id,
    ]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
