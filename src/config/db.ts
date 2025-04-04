import mysql from "mysql2/promise";
import "./dotenv";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "roboflow_clone",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

async function testDbConnection() {
  let connection: mysql.PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export { pool, testDbConnection };
