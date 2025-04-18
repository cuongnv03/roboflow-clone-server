import { UserProfileDTO, UserUpdateDTO } from "../dtos/user.dto";

export interface IUserService {
  getProfile(userId: number): Promise<UserProfileDTO>;
  updateProfile(userId: number, data: UserUpdateDTO): Promise<UserProfileDTO>;
}
