import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/database";
import { User, UserInput, JwtPayload } from "../types/user.types";
import config from "../config/app";
import AppError from "../utils/appError";

export class UserModel {
  /**
   * Create a new user
   */
  static async create(userData: UserInput): Promise<User> {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(userData.password, salt);

    const [result] = await pool.execute(
      "INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)",
      [userData.username, userData.email, password_hash],
    );

    const userId = (result as any).insertId;
    const [rows] = await pool.execute("SELECT * FROM Users WHERE user_id = ?", [
      userId,
    ]);

    return (rows as User[])[0];
  }

  /**
   * Find user by ID
   */
  static async findById(userId: number): Promise<User | null> {
    const [rows] = await pool.execute("SELECT * FROM Users WHERE user_id = ?", [
      userId,
    ]);

    const users = rows as User[];
    return users.length ? users[0] : null;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);

    const users = rows as User[];
    return users.length ? users[0] : null;
  }

  /**
   * Compare password with stored hash
   */
  static async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate JWT token
   */
  static generateToken(user: User): string {
    const payload: JwtPayload = {
      id: user.user_id,
      username: user.username,
      email: user.email,
    };

    if (!process.env.JWT_SECRET) {
      throw new AppError("JWT_SECRET environment variable is not set", 500);
    }
    const secret: jwt.Secret = process.env.JWT_SECRET;
    const options: jwt.SignOptions = {
      expiresIn: parseInt(String(process.env.JWT_EXPIRES_IN), 10),
    };

    return jwt.sign(payload, secret, options);
  }

  /**
   * Update user profile
   */
  static async update(userId: number, data: Partial<UserInput>): Promise<User> {
    // If password is provided, hash it
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    // Build update query dynamically
    const entries = Object.entries(data);
    if (entries.length === 0) {
      throw new AppError("No update data provided", 400);
    }

    const setClause = entries
      .map(([key, _]) => {
        // Map 'password' field to database column
        if (key === "password") return "password_hash = ?";
        return `${key} = ?`;
      })
      .join(", ");

    const values = entries.map(([key, value]) => value);
    values.push(String(userId));

    await pool.execute(
      `UPDATE Users SET ${setClause} WHERE user_id = ?`,
      values,
    );

    // Get updated user
    const user = await this.findById(userId);
    if (!user) {
      throw new AppError("User not found after update", 404);
    }

    return user;
  }
}
