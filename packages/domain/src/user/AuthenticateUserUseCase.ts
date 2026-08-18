import { User } from './User';
import { Email } from './Email';
import { PasswordHasher } from './PasswordHasher';
import { UserRepository } from './UserRepository';
import { InvalidCredentialsError } from './errors';

export interface AuthenticateUserInput {
  email: string;
  plainPassword: string;
}

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<User> {
    const user = await this.userRepository.findByEmail(Email.create(input.email));
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.verify(
      input.plainPassword,
      user.getHashedPassword(),
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    return user;
  }
}
