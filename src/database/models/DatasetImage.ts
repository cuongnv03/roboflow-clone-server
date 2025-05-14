import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";
import Dataset from "./Dataset";
import Image from "./Image";

export type DatasetSplit = "train" | "valid" | "test";

export interface DatasetImageAttributes {
  dataset_id: number;
  image_id: number;
  split: DatasetSplit;
}

class DatasetImage
  extends Model<DatasetImageAttributes, DatasetImageAttributes>
  implements DatasetImageAttributes
{
  public dataset_id!: number;
  public image_id!: number;
  public split!: DatasetSplit;
}

DatasetImage.init(
  {
    dataset_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Dataset,
        key: "dataset_id",
      },
    },
    image_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Image,
        key: "image_id",
      },
    },
    split: {
      type: DataTypes.ENUM("train", "valid", "test"),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Dataset_Images",
    modelName: "DatasetImage",
    timestamps: false,
  },
);

// Setup associations - make sure these are properly set up
Dataset.belongsToMany(Image, {
  through: DatasetImage,
  foreignKey: "dataset_id",
  otherKey: "image_id",
  as: "images",
});

Image.belongsToMany(Dataset, {
  through: DatasetImage,
  foreignKey: "image_id",
  otherKey: "dataset_id",
  as: "datasets",
});

// Thiết lập quan hệ trực tiếp với DatasetImage
Dataset.hasMany(DatasetImage, { foreignKey: "dataset_id" });
DatasetImage.belongsTo(Dataset, { foreignKey: "dataset_id" });

Image.hasMany(DatasetImage, { foreignKey: "image_id" });
DatasetImage.belongsTo(Image, { foreignKey: "image_id" });

export default DatasetImage;
