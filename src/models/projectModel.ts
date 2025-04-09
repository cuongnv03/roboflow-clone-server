import { pool } from "../config/database";
import { Project, ProjectInput, ProjectType } from "../types/project.types";
import AppError from "../utils/appError";

export class ProjectModel {
  /**
   * Create a new project
   */
  static async create(
    userId: number,
    projectData: ProjectInput,
  ): Promise<Project> {
    const [result] = await pool.execute(
      "INSERT INTO Projects (user_id, name, description, type) VALUES (?, ?, ?, ?)",
      [
        userId,
        projectData.name,
        projectData.description || null,
        projectData.type,
      ],
    );

    const projectId = (result as any).insertId;
    return this.findById(projectId);
  }

  /**
   * Find project by ID
   */
  static async findById(projectId: number): Promise<Project> {
    const [rows] = await pool.execute(
      "SELECT * FROM Projects WHERE project_id = ?",
      [projectId],
    );

    const projects = rows as Project[];
    if (!projects.length) {
      throw new AppError("Project not found", 404);
    }

    return projects[0];
  }

  /**
   * Get all projects for a user
   */
  static async findByUserId(userId: number): Promise<Project[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM Projects WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );

    return rows as Project[];
  }

  /**
   * Update project details
   */
  static async update(
    projectId: number,
    userId: number,
    data: Partial<ProjectInput>,
  ): Promise<Project> {
    // Verify project belongs to user
    await this.verifyProjectOwnership(projectId, userId);

    // Build update query dynamically
    const entries = Object.entries(data).filter(
      ([_, value]) => value !== undefined,
    );
    if (entries.length === 0) {
      throw new AppError("No update data provided", 400);
    }

    const setClause = entries.map(([key, _]) => `${key} = ?`).join(", ");

    const values = entries.map(([_, value]) => value);
    values.push(String(projectId));

    await pool.execute(
      `UPDATE Projects SET ${setClause} WHERE project_id = ?`,
      values,
    );

    return this.findById(projectId);
  }

  /**
   * Delete a project
   */
  static async delete(projectId: number, userId: number): Promise<void> {
    // Verify project belongs to user
    await this.verifyProjectOwnership(projectId, userId);

    await pool.execute("DELETE FROM Projects WHERE project_id = ?", [
      projectId,
    ]);
  }

  /**
   * Verify a project belongs to a user
   */
  static async verifyProjectOwnership(
    projectId: number,
    userId: number,
  ): Promise<void> {
    const [rows] = await pool.execute(
      "SELECT * FROM Projects WHERE project_id = ? AND user_id = ?",
      [projectId, userId],
    );

    const projects = rows as Project[];
    if (!projects.length) {
      throw new AppError(
        "Project not found or you do not have permission to access it",
        404,
      );
    }
  }

  /**
   * Get project stats (image count, annotations, etc.)
   */
  static async getProjectStats(projectId: number): Promise<any> {
    const [totalImages] = await pool.execute(
      "SELECT COUNT(*) as total FROM Images WHERE project_id = ?",
      [projectId],
    );

    const [annotatedImages] = await pool.execute(
      'SELECT COUNT(*) as annotated FROM Images WHERE project_id = ? AND status = "annotated"',
      [projectId],
    );

    const [totalAnnotations] = await pool.execute(
      `SELECT COUNT(*) as total FROM Annotations a
       JOIN Images i ON a.image_id = i.image_id
       WHERE i.project_id = ?`,
      [projectId],
    );

    const [classDistribution] = await pool.execute(
      `SELECT c.name, COUNT(*) as count FROM Annotations a
       JOIN Classes c ON a.class_id = c.class_id
       JOIN Images i ON a.image_id = i.image_id
       WHERE i.project_id = ?
       GROUP BY c.class_id`,
      [projectId],
    );

    return {
      totalImages: (totalImages as any)[0].total,
      annotatedImages: (annotatedImages as any)[0].annotated,
      totalAnnotations: (totalAnnotations as any)[0].total,
      classDistribution: classDistribution,
    };
  }
}
