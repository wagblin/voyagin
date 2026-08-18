export class InvalidEmailError extends Error {
  constructor(value: string) {
    super(`"${value}" is not a valid email address.`);
    this.name = 'InvalidEmailError';
  }
}

export class InvalidUserNameError extends Error {
  constructor() {
    super('User name must not be empty.');
    this.name = 'InvalidUserNameError';
  }
}

export class WeakPasswordError extends Error {
  constructor() {
    super('Password must be at least 8 characters long.');
    this.name = 'WeakPasswordError';
  }
}

export class EmailAlreadyRegisteredError extends Error {
  constructor(email: string) {
    super(`An account already exists for ${email}.`);
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password.');
    this.name = 'InvalidCredentialsError';
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User ${userId} was not found.`);
    this.name = 'UserNotFoundError';
  }
}
