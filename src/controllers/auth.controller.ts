import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { pool } from "../config/db";
import { generateToken } from "../utils/jwtHelper";
import { AppError } from "../middleware/errorHandler";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { UserDb } from "../types/express/index";

const findUserByEmailOrUsername = async (
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

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return next(
      new AppError("Username, email, and password are required", 400),
    );
  }
  if (password.length < 6) {
    return next(
      new AppError("Password must be at least 6 characters long", 400),
    );
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const existingUser = await findUserByEmailOrUsername(email);
    if (existingUser) {
      if (existingUser.username === username) {
        await connection.rollback();
        return next(new AppError("Email or Username already exists", 409));
      }
      const existingUsername = await findUserByEmailOrUsername(username);
      if (existingUsername) {
        await connection.rollback();
        return next(new AppError("Username already exists", 409));
      }
      await connection.rollback();
      return next(new AppError("Email already exists", 409));
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const insertQuery =
      "INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)";
    const [result] = await connection.query<ResultSetHeader>(insertQuery, [
      username,
      email,
      password_hash,
    ]);

    const userId = result.insertId;
    const tokenPayload = { userId: userId, email: email };
    const token = generateToken(tokenPayload);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { userId, username, email },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Registration Error:", error);
    next(new AppError("Registration failed", 500));
  } finally {
    connection.release();
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return next(new AppError("Email/Username and password are required", 400));
  }

  try {
    const user = await findUserByEmailOrUsername(identifier);

    if (!user) {
      return next(new AppError("Invalid credentials", 401));
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return next(new AppError("Invalid credentials", 401));
    }

    if (!user.is_active) {
      return next(new AppError("Account is inactive", 403));
    }

    const tokenPayload = { userId: user.user_id, email: user.email };
    const token = generateToken(tokenPayload);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    next(new AppError("Login failed", 500));
  }
};
