import { IUserRepository } from "../IUserRepository";
import User, { UserCreationAttributes } from "../../../database/models/User";
import { NotFoundError } from "../../../exceptions/NotFoundError";
import bcrypt from "bcrypt";

export class UserRepository implements IUserRepository {
  async create(userData: UserCreationAttributes): Promise<User> {
    // Hash the password before creating the user
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(userData.password, salt);

      // Create a new object with password_hash set
      return User.create({
        ...userData,
        password_hash: hash,
      } as any);
    } else {
      throw new Error("Password is required");
    }
  }

  async findById(id: number): Promise<User | null> {
    return User.findByPk(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  async update(
    id: number,
    data: Partial<UserCreationAttributes>,
  ): Promise<User> {
    const user = await User.findByPk(id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user.update(data);
  }
}
