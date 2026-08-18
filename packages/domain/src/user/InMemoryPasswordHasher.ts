import { PasswordHasher } from './PasswordHasher';

const HASH_PREFIX = 'hashed:';

export class InMemoryPasswordHasher implements PasswordHasher {
  hash(plainPassword: string): Promise<string> {
    return Promise.resolve(`${HASH_PREFIX}${plainPassword}`);
  }

  verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return Promise.resolve(hashedPassword === `${HASH_PREFIX}${plainPassword}`);
  }
}
