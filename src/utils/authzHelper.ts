import { pool } from "../config/db";
// Use 'import type' for interfaces coming from the .d.ts file
import type { ProjectDb, ImageDb, ClassDb } from "../types/express/index.d";
import { AppError } from "../middleware/errorHandler";

/**
 * Checks if the logged-in user owns the specified project.
 * Throws an AppError if not found or not authorized.
 * @param projectId - The ID of the project to check.
 * @param userId - The ID of the logged-in user.
 * @returns The project object if authorized.
 */
export const checkProjectAuthorization = async (
  projectId: number,
  userId: number,
): Promise<ProjectDb> => {
  const connection = await pool.getConnection();
  try {
    const query = `SELECT * FROM Projects WHERE project_id = ? LIMIT 1`;
    const [rows] = await connection.query<ProjectDb[]>(query, [projectId]);

    if (rows.length === 0) {
      throw new AppError("Project not found", 404);
    }
    const project = rows[0];
    if (project.user_id !== userId) {
      throw new AppError("You are not authorized to access this project", 403);
    }
    return project;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Project Authorization Check Error:", error);
    throw new AppError("Failed to verify project authorization", 500);
  } finally {
    connection.release();
  }
};

/**
 * Checks if an image exists and belongs to the specified project.
 * Throws an AppError if not found.
 */
export const checkImageExistsInProject = async (
  imageId: number,
  projectId: number,
): Promise<ImageDb> => {
  const connection = await pool.getConnection();
  try {
    const query =
      "SELECT * FROM Images WHERE image_id = ? AND project_id = ? LIMIT 1";
    const [rows] = await connection.query<ImageDb[]>(query, [
      imageId,
      projectId,
    ]);
    if (rows.length === 0) {
      throw new AppError(
        `Image with ID ${imageId} not found in project ${projectId}`,
        404,
      );
    }
    return rows[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Image Existence Check Error:", error);
    throw new AppError("Failed to verify image existence", 500);
  } finally {
    connection.release();
  }
};

/**
 * Checks if a class exists and belongs to the specified project.
 * Throws an AppError if not found.
 */
export const checkClassExistsInProject = async (
  classId: number,
  projectId: number,
): Promise<ClassDb> => {
  const connection = await pool.getConnection();
  try {
    const query =
      "SELECT * FROM Classes WHERE class_id = ? AND project_id = ? LIMIT 1";
    const [rows] = await connection.query<ClassDb[]>(query, [
      classId,
      projectId,
    ]);
    if (rows.length === 0) {
      throw new AppError(
        `Class with ID ${classId} not found in project ${projectId}`,
        404,
      );
    }
    return rows[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Class Existence Check Error:", error);
    throw new AppError("Failed to verify class existence", 500);
  } finally {
    connection.release();
  }
};
