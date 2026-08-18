import { WeakPasswordError } from './errors';

const MINIMUM_LENGTH = 8;

export class PasswordPolicy {
  static validate(plainPassword: string): void {
    if (plainPassword.length < MINIMUM_LENGTH) {
      throw new WeakPasswordError();
    }
  }
}
