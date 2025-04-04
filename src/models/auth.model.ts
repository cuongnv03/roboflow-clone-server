import { pool } from "../config/db";
import type { UserDb } from "../types/express/index";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { AppError } from "../middleware/errorHandler";

export const findUserByEmailOrUsername = async (
  identifier: string,
): Promise<UserDb | null> => {
  const connection = await pool.getConnection();
  try {
    const query = "SELECT * FROM Users WHERE email = ? OR username = ? LIMIT 1";
    const [rows] = await connection.query<UserDb[]>(query, [
      identifier,
      identifier,
    ]);
    return rows.length > 0 ? rows[0] : null;
  } finally {
    connection.release();
  }
};

export const registerUser = async (
  username: string,
  email: string,
  password_hash: string,
): Promise<number> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if email already exists
    const [emailRows] = await connection.query<RowDataPacket[]>(
      "SELECT user_id FROM Users WHERE email = ? LIMIT 1",
      [email],
    );
    if (emailRows.length > 0) {
      throw new AppError("Email already exists", 409);
    }

    // Check if username already exists
    const [usernameRows] = await connection.query<RowDataPacket[]>(
      "SELECT user_id FROM Users WHERE username = ? LIMIT 1",
      [username],
    );
    if (usernameRows.length > 0) {
      throw new AppError("Username already exists", 409);
    }

    // Insert new user
    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, password_hash],
    );

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
