import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../config/database";
import Project from "./Project";

export type ImageStatus = "uploaded" | "annotated" | "processed";

export interface ImageAttributes {
  image_id: number;
  project_id: number;
  file_path: string;
  original_filename: string;
  width: number;
  height: number;
  upload_date: Date;
  status: ImageStatus;
  batch_name: string | null;
}

export interface ImageCreationAttributes
  extends Optional<
    ImageAttributes,
    "image_id" | "upload_date" | "status" | "batch_name"
  > {}

class Image
  extends Model<ImageAttributes, ImageCreationAttributes>
  implements ImageAttributes
{
  public image_id!: number;
  public project_id!: number;
  public file_path!: string;
  public original_filename!: string;
  public width!: number;
  public height!: number;
  public upload_date!: Date;
  public status!: ImageStatus;
  public batch_name!: string | null;
}

Image.init(
  {
    image_id: {
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
    file_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    original_filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    upload_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("uploaded", "annotated", "processed"),
      defaultValue: "uploaded",
    },
    batch_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "Images",
    modelName: "Image",
    timestamps: false,
  },
);

// Setup associations
Image.belongsTo(Project, { foreignKey: "project_id" });
Project.hasMany(Image, { foreignKey: "project_id", onDelete: "CASCADE" });

export default Image;
