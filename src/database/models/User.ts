import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../config/database";
import bcrypt from "bcrypt";

export interface UserAttributes {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    "user_id" | "is_active" | "created_at" | "updated_at"
  > {
  password: string; // Virtual field for creation
}

export interface UserTokenPayload {
  id: number;
  username: string;
  email: string;
}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public user_id!: number;
  public username!: string;
  public email!: string;
  public password_hash!: string;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual field
  public password?: string;

  // Instance methods
  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }
}

User.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: "Users",
    modelName: "User",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password, salt);
          delete user.password;
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password, salt);
          delete user.password;
        }
      },
    },
  },
);

export default User;
