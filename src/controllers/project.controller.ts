import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import type { ProjectDb } from "../types/express/index.d";
import { ProjectType, allowedProjectTypes } from "../types/projectTypes";
import type { ResultSetHeader, OkPacket } from "mysql2";
import { checkProjectAuthorization } from "../utils/authzHelper";

// --- Create Project Controller ---
export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { name, description, type } = req.body;
  const userId = req.user?.userId;

  // This check already exists and is correct
  if (!userId) {
    return next(new AppError("Authentication error: User ID not found", 401));
  }
  if (!name || !type) {
    return next(new AppError("Project name and type are required", 400));
  }
  if (!allowedProjectTypes.includes(type as ProjectType)) {
    return next(
      new AppError(
        `Invalid project type. Allowed types are: ${allowedProjectTypes.join(
          ", ",
        )}`,
        400,
      ),
    );
  }

  const connection = await pool.getConnection();
  try {
    const insertQuery =
      "INSERT INTO Projects (user_id, name, description, type) VALUES (?, ?, ?, ?)";
    const [result] = await connection.query<ResultSetHeader>(insertQuery, [
      userId, // userId is guaranteed to be a number here because of the check above
      name,
      description || null,
      type,
    ]);
    const insertedId = result.insertId;
    const [rows] = await connection.query<ProjectDb[]>(
      "SELECT * FROM Projects WHERE project_id = ?",
      [insertedId],
    );
    if (rows.length === 0) {
      throw new AppError("Failed to retrieve created project", 500);
    }
    res
      .status(201)
      .json({
        success: true,
        message: "Project created successfully",
        project: rows[0],
      });
  } catch (error) {
    console.error("Create Project Error:", error);
    next(new AppError("Failed to create project", 500));
  } finally {
    connection.release();
  }
};

// --- Get User's Projects Controller ---
export const getMyProjects = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;
  // This check already exists and is correct
  if (!userId) {
    return next(new AppError("Authentication error: User ID not found", 401));
  }
  const connection = await pool.getConnection();
  try {
    const query =
      "SELECT * FROM Projects WHERE user_id = ? ORDER BY created_at DESC";
    // userId is guaranteed to be a number here
    const [rows] = await connection.query<ProjectDb[]>(query, [userId]);
    res.status(200).json({ success: true, count: rows.length, projects: rows });
  } catch (error) {
    console.error("Get My Projects Error:", error);
    next(new AppError("Failed to retrieve projects", 500));
  } finally {
    connection.release();
  }
};

// --- Get Project By ID Controller ---
export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { projectId } = req.params;
  const userId = req.user?.userId; // Type is number | undefined

  // Add the missing check for userId BEFORE using it
  if (!userId) {
    return next(new AppError("Authentication error: User ID not found", 401));
  }
  if (!projectId || isNaN(parseInt(projectId, 10))) {
    return next(new AppError("Invalid project ID provided", 400));
  }

  const numericProjectId = parseInt(projectId, 10);
  try {
    // Now userId is guaranteed to be a number here
    const project = await checkProjectAuthorization(numericProjectId, userId);
    res.status(200).json({ success: true, project: project });
  } catch (error) {
    next(error);
  }
};

// --- Update Project Controller ---
export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { projectId } = req.params;
  const { name, description } = req.body;
  const userId = req.user?.userId; // Type is number | undefined

  // Add the missing check for userId BEFORE using it
  if (!userId) {
    return next(new AppError("Authentication error: User ID not found", 401));
  }
  if (!projectId || isNaN(parseInt(projectId, 10))) {
    return next(new AppError("Invalid project ID provided", 400));
  }
  if (!name && description === undefined) {
    return next(
      new AppError("No update data provided (name or description)", 400),
    );
  }

  const numericProjectId = parseInt(projectId, 10);
  const connection = await pool.getConnection();
  try {
    // Now userId is guaranteed to be a number here
    await checkProjectAuthorization(numericProjectId, userId);

    const updateFields: { name?: string; description?: string | null } = {};
    if (name) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    const updateQuery = "UPDATE Projects SET ? WHERE project_id = ?";
    const [result] = await connection.query<OkPacket>(updateQuery, [
      updateFields,
      numericProjectId,
    ]);
    if (result.affectedRows === 0) {
      throw new AppError("Failed to update project or project not found", 404); // Use 404
    }
    const [updatedRows] = await connection.query<ProjectDb[]>(
      "SELECT * FROM Projects WHERE project_id = ?",
      [numericProjectId],
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Project updated successfully",
        project: updatedRows[0],
      });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};

// --- Delete Project Controller ---
export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { projectId } = req.params;
  const userId = req.user?.userId; // Type is number | undefined

  // Add the missing check for userId BEFORE using it
  if (!userId) {
    return next(new AppError("Authentication error: User ID not found", 401));
  }
  if (!projectId || isNaN(parseInt(projectId, 10))) {
    return next(new AppError("Invalid project ID provided", 400));
  }

  const numericProjectId = parseInt(projectId, 10);
  const connection = await pool.getConnection();
  try {
    // Now userId is guaranteed to be a number here
    await checkProjectAuthorization(numericProjectId, userId);

    const deleteQuery = "DELETE FROM Projects WHERE project_id = ?";
    const [result] = await connection.query<OkPacket>(deleteQuery, [
      numericProjectId,
    ]);
    if (result.affectedRows === 0) {
      throw new AppError("Failed to delete project or project not found", 404); // Use 404
    }
    res
      .status(200)
      .json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete Project Error:", error);
    next(new AppError("Failed to delete project", 500));
  } finally {
    connection.release();
  }
};
