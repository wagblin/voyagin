import { User } from './User';
import { Email } from './Email';
import { PasswordPolicy } from './PasswordPolicy';
import { PasswordHasher } from './PasswordHasher';
import { UserRepository } from './UserRepository';
import { EmailAlreadyRegisteredError } from './errors';

export interface RegisterUserInput {
  email: string;
  name: string;
  plainPassword: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const email = Email.create(input.email);
    PasswordPolicy.validate(input.plainPassword);

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyRegisteredError(input.email);
    }

    const hashedPassword = await this.passwordHasher.hash(input.plainPassword);
    const user = User.create({ email, name: input.name, hashedPassword });
    await this.userRepository.save(user);
    return user;
  }
}
