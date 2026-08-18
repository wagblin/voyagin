import { InMemoryUserRepository } from '../InMemoryUserRepository';
import { User } from '../User';
import { UserId } from '../UserId';
import { Email } from '../Email';

describe('InMemoryUserRepository', () => {
  const buildUser = () =>
    User.create({
      email: Email.create('alex@voyagin.app'),
      name: 'Alex',
      hashedPassword: 'hashed:s3cret123',
    });

  it('returns the user that was saved', async () => {
    const repository = new InMemoryUserRepository();
    const user = buildUser();

    await repository.save(user);

    expect(await repository.findById(user.id)).toBe(user);
  });

  it('returns null when no user matches the given id', async () => {
    const repository = new InMemoryUserRepository();

    expect(await repository.findById(UserId.create('unknown'))).toBeNull();
  });

  it('finds a user by email', async () => {
    const repository = new InMemoryUserRepository();
    const user = buildUser();

    await repository.save(user);

    expect(await repository.findByEmail(Email.create('alex@voyagin.app'))).toBe(user);
  });

  it('returns null when no user matches the given email', async () => {
    const repository = new InMemoryUserRepository();

    expect(await repository.findByEmail(Email.create('unknown@voyagin.app'))).toBeNull();
  });

  it('removes a user from the repository', async () => {
    const repository = new InMemoryUserRepository();
    const user = buildUser();
    await repository.save(user);

    await repository.delete(user.id);

    expect(await repository.findById(user.id)).toBeNull();
  });
});
