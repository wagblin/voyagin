import { BcryptPasswordHasher } from '../BcryptPasswordHasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();
  const TEST_TIMEOUT_MS = 15000;

  it(
    'hashes a password into something different from the plain text',
    async () => {
      const hashed = await hasher.hash('correct horse battery staple');
      expect(hashed).not.toBe('correct horse battery staple');
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'verifies a matching plain password against its hash',
    async () => {
      const hashed = await hasher.hash('correct horse battery staple');
      expect(await hasher.verify('correct horse battery staple', hashed)).toBe(true);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'rejects a non-matching plain password',
    async () => {
      const hashed = await hasher.hash('correct horse battery staple');
      expect(await hasher.verify('wrong password', hashed)).toBe(false);
    },
    TEST_TIMEOUT_MS,
  );
});
