import { UpdateUserUseCase } from '../UpdateUserUseCase';
import { InMemoryUserRepository } from '../InMemoryUserRepository';
import { User } from '../User';
import { Email } from '../Email';
import { UserNotFoundError } from '../errors';

describe('UpdateUserUseCase', () => {
  const buildContext = async () => {
    const repository = new InMemoryUserRepository();
    const user = User.create({
      email: Email.create('alex@voyagin.app'),
      name: 'Alex',
      hashedPassword: 'hashed:s3cret123',
    });
    await repository.save(user);
    return { repository, user, useCase: new UpdateUserUseCase(repository) };
  };

  it('renames the user', async () => {
    const { repository, user, useCase } = await buildContext();

    const updated = await useCase.execute({ userId: user.id.toString(), name: 'Alexandra' });

    expect(updated.getName()).toBe('Alexandra');
    expect((await repository.findById(user.id))?.getName()).toBe('Alexandra');
  });

  it('changes the user email', async () => {
    const { user, useCase } = await buildContext();

    const updated = await useCase.execute({
      userId: user.id.toString(),
      email: 'alexandra@voyagin.app',
    });

    expect(updated.getEmail().equals(Email.create('alexandra@voyagin.app'))).toBe(true);
  });

  it('leaves fields untouched when not provided', async () => {
    const { user, useCase } = await buildContext();

    const updated = await useCase.execute({ userId: user.id.toString() });

    expect(updated.getName()).toBe('Alex');
    expect(updated.getEmail().equals(Email.create('alex@voyagin.app'))).toBe(true);
  });

  it('rejects updating a user that does not exist', async () => {
    const repository = new InMemoryUserRepository();
    const useCase = new UpdateUserUseCase(repository);

    await expect(useCase.execute({ userId: 'unknown', name: 'Alexandra' })).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
