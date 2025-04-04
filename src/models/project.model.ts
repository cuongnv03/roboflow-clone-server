import { pool } from "../config/db";
import type { ProjectDb } from "../types/express/index";
import { RowDataPacket, OkPacket, ResultSetHeader } from "mysql2";
import { AppError } from "../middleware/errorHandler";
import { ProjectType } from "../types/projectTypes";

export const handleCreateProject = async (
  userId: number,
  name: string,
  description: string | null,
  type: ProjectType,
): Promise<number> => {
  const connection = await pool.getConnection();
  try {
    const insertQuery =
      "INSERT INTO Projects (user_id, name, description, type) VALUES (?, ?, ?, ?)";
    const [result] = await connection.query<ResultSetHeader>(insertQuery, [
      userId,
      name,
      description,
      type,
    ]);
    return result.insertId;
  } finally {
    connection.release();
  }
};

export const getProjectsByUserId = async (
  userId: number,
): Promise<ProjectDb[]> => {
  const connection = await pool.getConnection();
  try {
    const query =
      "SELECT * FROM Projects WHERE user_id = ? ORDER BY created_at DESC";
    const [rows] = await connection.query<ProjectDb[]>(query, [userId]);
    return rows;
  } finally {
    connection.release();
  }
};

export const getProjectByIdForUser = async (
  projectId: number,
  userId: number,
): Promise<ProjectDb | null> => {
  const connection = await pool.getConnection();
  try {
    const query =
      "SELECT * FROM Projects WHERE project_id = ? AND user_id = ? LIMIT 1";
    const [rows] = await connection.query<ProjectDb[]>(query, [
      projectId,
      userId,
    ]);
    return rows.length > 0 ? rows[0] : null;
  } finally {
    connection.release();
  }
};

export const handleUpdateProject = async (
  projectId: number,
  userId: number,
  updates: Partial<ProjectDb>,
): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const updateQuery =
      "UPDATE Projects SET ? WHERE project_id = ? AND user_id = ?";
    const [result] = await connection.query<OkPacket>(updateQuery, [
      updates,
      projectId,
      userId,
    ]);
    if (result.affectedRows === 0) {
      throw new AppError("Project not found or not authorized", 404);
    }
  } finally {
    connection.release();
  }
};

export const handleDeleteProject = async (
  projectId: number,
  userId: number,
): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const deleteQuery =
      "DELETE FROM Projects WHERE project_id = ? AND user_id = ?";
    const [result] = await connection.query<OkPacket>(deleteQuery, [
      projectId,
      userId,
    ]);
    if (result.affectedRows === 0) {
      throw new AppError("Project not found or not authorized", 404);
    }
  } finally {
    connection.release();
  }
};
