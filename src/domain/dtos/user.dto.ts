export interface UserRegisterDTO {
  username: string;
  email: string;
  password: string;
}

export interface UserLoginDTO {
  email: string;
  password: string;
}

export interface UserProfileDTO {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserAuthResponseDTO {
  user: UserProfileDTO;
  token: string;
}

export interface UserUpdateDTO {
  username?: string;
  email?: string;
  password?: string;
}
