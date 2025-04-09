export interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface JwtPayload {
  id: number;
  username: string;
  email: string;
}
