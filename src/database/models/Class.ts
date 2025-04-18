import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../config/database";
import Project from "./Project";

export interface ClassAttributes {
  class_id: number;
  project_id: number;
  name: string;
  color: string;
  created_at: Date;
}

export interface ClassCreationAttributes
  extends Optional<ClassAttributes, "class_id" | "created_at" | "color"> {}

class Class
  extends Model<ClassAttributes, ClassCreationAttributes>
  implements ClassAttributes
{
  public class_id!: number;
  public project_id!: number;
  public name!: string;
  public color!: string;
  public created_at!: Date;
}

Class.init(
  {
    class_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Project,
        key: "project_id",
      },
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: "#000000",
      validate: {
        is: /^#[0-9A-F]{6}$/i,
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "Classes",
    modelName: "Class",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

// Setup associations
Class.belongsTo(Project, { foreignKey: "project_id" });
Project.hasMany(Class, { foreignKey: "project_id", onDelete: "CASCADE" });

export default Class;
