import {
  UserRegisterDTO,
  UserLoginDTO,
  UserAuthResponseDTO,
} from "../dtos/user.dto";
import { UserTokenPayload } from "../../database/models/User";

export interface IAuthService {
  register(userData: UserRegisterDTO): Promise<UserAuthResponseDTO>;
  login(credentials: UserLoginDTO): Promise<UserAuthResponseDTO>;
  generateToken(user: {
    user_id: number;
    username: string;
    email: string;
  }): string;
  verifyToken(token: string): UserTokenPayload;
}
