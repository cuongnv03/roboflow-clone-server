import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../config/database";
import User from "./User";

export type ProjectType =
  | "object_detection"
  | "classification"
  | "instance_segmentation"
  | "keypoint_detection"
  | "multimodal";

export interface ProjectAttributes {
  project_id: number;
  user_id: number;
  name: string;
  description: string | null;
  type: ProjectType;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectCreationAttributes
  extends Optional<
    ProjectAttributes,
    "project_id" | "created_at" | "updated_at" | "description"
  > {}

class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  public project_id!: number;
  public user_id!: number;
  public name!: string;
  public description!: string | null;
  public type!: ProjectType;
  public created_at!: Date;
  public updated_at!: Date;
}

Project.init(
  {
    project_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
        "object_detection",
        "classification",
        "instance_segmentation",
        "keypoint_detection",
        "multimodal",
      ),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "Projects",
    modelName: "Project",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

// Setup associations
Project.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Project, { foreignKey: "user_id" });

export default Project;
