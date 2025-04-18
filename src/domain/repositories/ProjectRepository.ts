import { IProjectRepository } from "../interfaces/IProjectRepository";
import Project, {
  ProjectCreationAttributes,
} from "../../database/models/Project";
import { ProjectStatsDTO } from "../dtos/project.dto";
import Image from "../../database/models/Image";
import sequelize from "../../config/database";
import { NotFoundError } from "../../exceptions/NotFoundError";
import { ForbiddenError } from "../../exceptions/ForbiddenError";

export class ProjectRepository implements IProjectRepository {
  async create(
    userId: number,
    projectData: Omit<ProjectCreationAttributes, "user_id">,
  ): Promise<Project> {
    return Project.create({
      ...projectData,
      user_id: userId,
    });
  }

  async findById(projectId: number): Promise<Project> {
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return project;
  }

  async findByUserId(userId: number): Promise<Project[]> {
    return Project.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });
  }

  async update(
    projectId: number,
    data: Partial<Omit<ProjectCreationAttributes, "user_id">>,
  ): Promise<Project> {
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    await project.update(data);
    return project;
  }

  async delete(projectId: number): Promise<void> {
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    await project.destroy();
  }

  async getProjectStats(projectId: number): Promise<ProjectStatsDTO> {
    // Check if project exists
    await this.findById(projectId);

    // Get total images
    const totalImages = await Image.count({
      where: { project_id: projectId },
    });

    // Get annotated images
    const annotatedImages = await Image.count({
      where: {
        project_id: projectId,
        status: "annotated",
      },
    });

    // Get annotations count from related model
    const [annotationsResult] = await sequelize.query(
      `
      SELECT COUNT(*) as total 
      FROM Annotations a
      JOIN Images i ON a.image_id = i.image_id
      WHERE i.project_id = ?
    `,
      {
        replacements: [projectId],
      },
    );

    const totalAnnotations = (annotationsResult as any)[0]?.total || 0;

    // Get class distribution
    const [classDistResult] = await sequelize.query(
      `
      SELECT c.name, COUNT(*) as count 
      FROM Annotations a
      JOIN Classes c ON a.class_id = c.class_id
      JOIN Images i ON a.image_id = i.image_id
      WHERE i.project_id = ?
      GROUP BY c.class_id
    `,
      {
        replacements: [projectId],
      },
    );

    return {
      totalImages,
      annotatedImages,
      totalAnnotations,
      classDistribution: classDistResult as Array<{
        name: string;
        count: number;
      }>,
    };
  }

  async verifyOwnership(projectId: number, userId: number): Promise<boolean> {
    const project = await Project.findOne({
      where: { project_id: projectId, user_id: userId },
    });

    if (!project) {
      throw new ForbiddenError(
        "Project not found or you do not have permission to access it",
      );
    }

    return true;
  }
}
