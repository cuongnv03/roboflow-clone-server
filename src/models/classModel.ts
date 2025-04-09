import { pool } from "../config/database";
import { ProjectClass, ClassInput } from "../types/project.types";
import AppError from "../utils/appError";
import { ProjectModel } from "./projectModel";

export class ClassModel {
  /**
   * Create a new class for a project
   */
  static async create(
    projectId: number,
    userId: number,
    classData: ClassInput,
  ): Promise<ProjectClass> {
    // Verify project ownership
    await ProjectModel.verifyProjectOwnership(projectId, userId);

    const [result] = await pool.execute(
      "INSERT INTO Classes (project_id, name, color) VALUES (?, ?, ?)",
      [projectId, classData.name, classData.color || "#000000"],
    );

    const classId = (result as any).insertId;
    return this.findById(classId);
  }

  /**
   * Find class by ID
   */
  static async findById(classId: number): Promise<ProjectClass> {
    const [rows] = await pool.execute(
      "SELECT * FROM Classes WHERE class_id = ?",
      [classId],
    );

    const classes = rows as ProjectClass[];
    if (!classes.length) {
      throw new AppError("Class not found", 404);
    }

    return classes[0];
  }

  /**
   * Get all classes for a project
   */
  static async findByProjectId(projectId: number): Promise<ProjectClass[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM Classes WHERE project_id = ? ORDER BY name ASC",
      [projectId],
    );

    return rows as ProjectClass[];
  }

  /**
   * Update class details
   */
  static async update(
    classId: number,
    userId: number,
    data: Partial<ClassInput>,
  ): Promise<ProjectClass> {
    // Get the class to check project ownership
    const classData = await this.findById(classId);

    // Verify project ownership
    await ProjectModel.verifyProjectOwnership(classData.project_id, userId);

    // Build update query dynamically
    const entries = Object.entries(data).filter(
      ([_, value]) => value !== undefined,
    );
    if (entries.length === 0) {
      throw new AppError("No update data provided", 400);
    }

    const setClause = entries.map(([key, _]) => `${key} = ?`).join(", ");

    const values = entries.map(([_, value]) => value);
    values.push(String(classId));

    await pool.execute(
      `UPDATE Classes SET ${setClause} WHERE class_id = ?`,
      values,
    );

    return this.findById(classId);
  }

  /**
   * Delete a class
   */
  static async delete(classId: number, userId: number): Promise<void> {
    // Get the class to check project ownership
    const classData = await this.findById(classId);

    // Verify project ownership
    await ProjectModel.verifyProjectOwnership(classData.project_id, userId);

    await pool.execute("DELETE FROM Classes WHERE class_id = ?", [classId]);
  }

  /**
   * Check if a class belongs to a specific project
   */
  static async verifyClassBelongsToProject(
    classId: number,
    projectId: number,
  ): Promise<void> {
    const [rows] = await pool.execute(
      "SELECT * FROM Classes WHERE class_id = ? AND project_id = ?",
      [classId, projectId],
    );

    const classes = rows as ProjectClass[];
    if (!classes.length) {
      throw new AppError("Class not found in this project", 404);
    }
  }
}
