import { User } from './User';
import { UserId } from './UserId';
import { Email } from './Email';
import { UserRepository } from './UserRepository';
import { UserNotFoundError } from './errors';

export interface UpdateUserInput {
  userId: string;
  name?: string;
  email?: string;
}

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserInput): Promise<User> {
    const user = await this.userRepository.findById(UserId.create(input.userId));
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    if (input.name !== undefined) {
      user.rename(input.name);
    }

    if (input.email !== undefined) {
      user.changeEmail(Email.create(input.email));
    }

    await this.userRepository.save(user);
    return user;
  }
}
