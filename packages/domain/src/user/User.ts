import { UserId } from './UserId';
import { Email } from './Email';
import { InvalidUserNameError } from './errors';

export interface CreateUserProps {
  email: Email;
  name: string;
  hashedPassword: string;
}

export interface ReconstituteUserProps {
  id: string;
  email: Email;
  name: string;
  hashedPassword: string;
}

export class User {
  private constructor(
    public readonly id: UserId,
    private email: Email,
    private name: string,
    private hashedPassword: string,
  ) {}

  static create(props: CreateUserProps): User {
    const trimmedName = props.name.trim();
    if (trimmedName.length === 0) {
      throw new InvalidUserNameError();
    }
    return new User(UserId.generate(), props.email, trimmedName, props.hashedPassword);
  }

  static reconstitute(props: ReconstituteUserProps): User {
    return new User(UserId.create(props.id), props.email, props.name, props.hashedPassword);
  }

  rename(newName: string): void {
    const trimmedName = newName.trim();
    if (trimmedName.length === 0) {
      throw new InvalidUserNameError();
    }
    this.name = trimmedName;
  }

  changeEmail(newEmail: Email): void {
    this.email = newEmail;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): Email {
    return this.email;
  }

  getHashedPassword(): string {
    return this.hashedPassword;
  }
}
