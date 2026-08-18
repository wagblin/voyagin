import { InMemoryPasswordHasher } from '../InMemoryPasswordHasher';

describe('InMemoryPasswordHasher', () => {
  it('produces a hash that differs from the plain password', async () => {
    const hasher = new InMemoryPasswordHasher();
    const hashed = await hasher.hash('s3cret123');
    expect(hashed).not.toBe('s3cret123');
  });

  it('verifies a plain password against its own hash', async () => {
    const hasher = new InMemoryPasswordHasher();
    const hashed = await hasher.hash('s3cret123');
    expect(await hasher.verify('s3cret123', hashed)).toBe(true);
  });

  it('rejects an incorrect plain password against a hash', async () => {
    const hasher = new InMemoryPasswordHasher();
    const hashed = await hasher.hash('s3cret123');
    expect(await hasher.verify('wrong-password', hashed)).toBe(false);
  });
});
