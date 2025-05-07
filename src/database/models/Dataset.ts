import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../config/database";
import Project from "./Project";

export type DatasetStatus = "pending" | "generating" | "completed" | "failed";

export interface DatasetAttributes {
  dataset_id: number;
  project_id: number;
  name: string;
  preprocessing_settings: any;
  augmentation_settings: any;
  created_date: Date;
  status: DatasetStatus;
}

export interface DatasetCreationAttributes
  extends Optional<
    DatasetAttributes,
    "dataset_id" | "created_date" | "status"
  > {}

class Dataset
  extends Model<DatasetAttributes, DatasetCreationAttributes>
  implements DatasetAttributes
{
  public dataset_id!: number;
  public project_id!: number;
  public name!: string;
  public preprocessing_settings!: any;
  public augmentation_settings!: any;
  public created_date!: Date;
  public status!: DatasetStatus;
}

Dataset.init(
  {
    dataset_id: {
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
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    preprocessing_settings: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    augmentation_settings: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("pending", "generating", "completed", "failed"),
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    tableName: "Datasets",
    modelName: "Dataset",
    timestamps: false,
  },
);

// Setup associations
Dataset.belongsTo(Project, { foreignKey: "project_id" });
Project.hasMany(Dataset, { foreignKey: "project_id", onDelete: "CASCADE" });

export default Dataset;
