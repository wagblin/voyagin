import { RegisterUserUseCase } from '../RegisterUserUseCase';
import { InMemoryUserRepository } from '../InMemoryUserRepository';
import { InMemoryPasswordHasher } from '../InMemoryPasswordHasher';
import { Email } from '../Email';
import { InvalidEmailError, WeakPasswordError, EmailAlreadyRegisteredError } from '../errors';

describe('RegisterUserUseCase', () => {
  const buildUseCase = () => {
    const repository = new InMemoryUserRepository();
    const hasher = new InMemoryPasswordHasher();
    return { repository, hasher, useCase: new RegisterUserUseCase(repository, hasher) };
  };

  it('registers a user and persists it through the repository port', async () => {
    const { repository, useCase } = buildUseCase();

    const user = await useCase.execute({
      email: 'alex@voyagin.app',
      name: 'Alex',
      plainPassword: 's3cret123',
    });

    const stored = await repository.findById(user.id);
    expect(stored).toBe(user);
    expect(user.getEmail().equals(Email.create('alex@voyagin.app'))).toBe(true);
  });

  it('never stores the plain password', async () => {
    const { useCase } = buildUseCase();

    const user = await useCase.execute({
      email: 'alex@voyagin.app',
      name: 'Alex',
      plainPassword: 's3cret123',
    });

    expect(user.getHashedPassword()).not.toBe('s3cret123');
  });

  it('rejects an invalid email without persisting anything', async () => {
    const { repository, useCase } = buildUseCase();

    await expect(
      useCase.execute({ email: 'not-an-email', name: 'Alex', plainPassword: 's3cret123' }),
    ).rejects.toThrow(InvalidEmailError);
    expect(await repository.findByEmail(Email.create('alex@voyagin.app'))).toBeNull();
  });

  it('rejects a password that does not meet the password policy', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({ email: 'alex@voyagin.app', name: 'Alex', plainPassword: 'short' }),
    ).rejects.toThrow(WeakPasswordError);
  });

  it('rejects registering an email that is already taken', async () => {
    const { useCase } = buildUseCase();
    await useCase.execute({
      email: 'alex@voyagin.app',
      name: 'Alex',
      plainPassword: 's3cret123',
    });

    await expect(
      useCase.execute({ email: 'alex@voyagin.app', name: 'Someone else', plainPassword: 'anotherPass1' }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);
  });
});
