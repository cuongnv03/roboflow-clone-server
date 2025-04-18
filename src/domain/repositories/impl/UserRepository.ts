import { IUserRepository } from "../IUserRepository";
import User, { UserCreationAttributes } from "../../../database/models/User";
import { NotFoundError } from "../../../exceptions/NotFoundError";

export class UserRepository implements IUserRepository {
  async create(userData: UserCreationAttributes): Promise<User> {
    return User.create(userData);
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
