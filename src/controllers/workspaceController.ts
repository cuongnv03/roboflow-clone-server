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
