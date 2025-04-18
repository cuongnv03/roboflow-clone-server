import { IUserService } from "../interfaces/IUserService";
import { IUserRepository } from "../interfaces/IUserRepository";
import { UserProfileDTO, UserUpdateDTO } from "../dtos/user.dto";
import { NotFoundError } from "../../exceptions/NotFoundError";

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async getProfile(userId: number): Promise<UserProfileDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.user_id,
      username: user.username,
      email: user.email,
      isActive: user.is_active,
      createdAt: user.created_at.toISOString(),
    };
  }

  async updateProfile(
    userId: number,
    data: UserUpdateDTO,
  ): Promise<UserProfileDTO> {
    const updated = await this.userRepository.update(userId, {
      username: data.username,
      email: data.email,
      password: data.password,
    });

    return {
      id: updated.user_id,
      username: updated.username,
      email: updated.email,
      isActive: updated.is_active,
      createdAt: updated.created_at.toISOString(),
    };
  }
}
