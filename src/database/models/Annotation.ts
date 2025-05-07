import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../config/database";
import Image from "./Image";
import Class from "./Class";

export interface AnnotationAttributes {
  annotation_id: number;
  image_id: number;
  class_id: number;
  annotation_data: any;
  created_at: Date;
  is_valid: boolean;
}

export interface AnnotationCreationAttributes
  extends Optional<
    AnnotationAttributes,
    "annotation_id" | "created_at" | "is_valid"
  > {}

class Annotation
  extends Model<AnnotationAttributes, AnnotationCreationAttributes>
  implements AnnotationAttributes
{
  public annotation_id!: number;
  public image_id!: number;
  public class_id!: number;
  public annotation_data!: any;
  public created_at!: Date;
  public is_valid!: boolean;
}

Annotation.init(
  {
    annotation_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    image_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Image,
        key: "image_id",
      },
    },
    class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Class,
        key: "class_id",
      },
    },
    annotation_data: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    is_valid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "Annotations",
    modelName: "Annotation",
    timestamps: false,
  },
);

// Setup associations
Annotation.belongsTo(Image, { foreignKey: "image_id" });
Image.hasMany(Annotation, { foreignKey: "image_id", onDelete: "CASCADE" });

Annotation.belongsTo(Class, { foreignKey: "class_id" });
Class.hasMany(Annotation, { foreignKey: "class_id" });

export default Annotation;
