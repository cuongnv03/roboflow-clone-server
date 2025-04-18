import User, { UserCreationAttributes } from "../../database/models/User";

export interface IUserRepository {
  create(userData: UserCreationAttributes): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: number, data: Partial<UserCreationAttributes>): Promise<User>;
}
