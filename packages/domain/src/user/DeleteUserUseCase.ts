import { UserId } from './UserId';
import { UserRepository } from './UserRepository';
import { UserNotFoundError } from './errors';

export interface DeleteUserInput {
  userId: string;
}

export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: DeleteUserInput): Promise<void> {
    const user = await this.userRepository.findById(UserId.create(input.userId));
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    await this.userRepository.delete(user.id);
  }
}
