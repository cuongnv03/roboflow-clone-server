import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "roboflow_clone",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "Cg0987191375",
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

export default sequelize;
