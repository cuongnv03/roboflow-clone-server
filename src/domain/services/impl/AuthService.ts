import { IAuthService } from "../IAuthService";
import { IUserRepository } from "../../repositories/IUserRepository";
import User, { UserTokenPayload } from "../../../database/models/User";
import {
  UserRegisterDTO,
  UserLoginDTO,
  UserAuthResponseDTO,
  UserProfileDTO,
} from "../../dtos/user.dto";
import jwt from "jsonwebtoken";
import { AuthenticationError } from "../../../exceptions/AuthenticationError";
import { ConflictError } from "../../../exceptions/ConflictError";
import config from "../../../config/app";

export class AuthService implements IAuthService {
  constructor(private userRepository: IUserRepository) {}

  async register(userData: UserRegisterDTO): Promise<UserAuthResponseDTO> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Create user
    const user = await this.userRepository.create({
      username: userData.username,
      email: userData.email,
      password: userData.password,
    } as any);

    // Generate token
    const token = this.generateToken(user);

    // Map to DTO
    return {
      user: this.mapToUserProfileDTO(user),
      token,
    };
  }

  async login(credentials: UserLoginDTO): Promise<UserAuthResponseDTO> {
    // Find user
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(credentials.password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Generate token
    const token = this.generateToken(user);

    // Map to DTO
    return {
      user: this.mapToUserProfileDTO(user),
      token,
    };
  }

  generateToken(user: {
    user_id: number;
    username: string;
    email: string;
  }): string {
    const payload: UserTokenPayload = {
      id: user.user_id,
      username: user.username,
      email: user.email,
    };

    return jwt.sign(payload, config.jwtSecret || "default-secret-for-dev", {
      expiresIn: config.jwtExpiresIn,
    });
  }

  verifyToken(token: string): UserTokenPayload {
    try {
      if (!config.jwtSecret) {
        throw new Error("JWT secret is not defined");
      }
      return jwt.verify(token, config.jwtSecret) as unknown as UserTokenPayload;
    } catch (error) {
      throw new AuthenticationError("Invalid or expired token");
    }
  }

  // Helper method to map User model to DTO
  private mapToUserProfileDTO(user: User): UserProfileDTO {
    return {
      id: user.user_id,
      username: user.username,
      email: user.email,
      isActive: user.is_active,
      createdAt: user.created_at.toISOString(),
    };
  }
}
