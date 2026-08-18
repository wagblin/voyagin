import { AuthenticateUserUseCase } from '../AuthenticateUserUseCase';
import { RegisterUserUseCase } from '../RegisterUserUseCase';
import { InMemoryUserRepository } from '../InMemoryUserRepository';
import { InMemoryPasswordHasher } from '../InMemoryPasswordHasher';
import { InvalidCredentialsError } from '../errors';

describe('AuthenticateUserUseCase', () => {
  const buildContext = () => {
    const repository = new InMemoryUserRepository();
    const hasher = new InMemoryPasswordHasher();
    const registerUser = new RegisterUserUseCase(repository, hasher);
    const useCase = new AuthenticateUserUseCase(repository, hasher);
    return { repository, hasher, registerUser, useCase };
  };

  const captureError = async (thunk: () => Promise<unknown>): Promise<Error> => {
    try {
      await thunk();
    } catch (error) {
      return error as Error;
    }
    throw new Error('Expected thunk to throw but it did not.');
  };

  it('authenticates a user with correct credentials', async () => {
    const { registerUser, useCase } = buildContext();
    await registerUser.execute({
      email: 'alex@voyagin.app',
      name: 'Alex',
      plainPassword: 's3cret123',
    });

    const authenticated = await useCase.execute({
      email: 'alex@voyagin.app',
      plainPassword: 's3cret123',
    });

    expect(authenticated.getName()).toBe('Alex');
  });

  it('rejects an unknown email with InvalidCredentialsError', async () => {
    const { useCase } = buildContext();

    await expect(
      useCase.execute({ email: 'unknown@voyagin.app', plainPassword: 's3cret123' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('rejects a wrong password with InvalidCredentialsError', async () => {
    const { registerUser, useCase } = buildContext();
    await registerUser.execute({
      email: 'alex@voyagin.app',
      name: 'Alex',
      plainPassword: 's3cret123',
    });

    await expect(
      useCase.execute({ email: 'alex@voyagin.app', plainPassword: 'wrong-password' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('never reveals whether the email or the password was the reason authentication failed', async () => {
    const { registerUser, useCase } = buildContext();
    await registerUser.execute({
      email: 'alex@voyagin.app',
      name: 'Alex',
      plainPassword: 's3cret123',
    });

    const unknownEmailError = await captureError(() =>
      useCase.execute({ email: 'unknown@voyagin.app', plainPassword: 's3cret123' }),
    );
    const wrongPasswordError = await captureError(() =>
      useCase.execute({ email: 'alex@voyagin.app', plainPassword: 'wrong-password' }),
    );

    expect(unknownEmailError).toBeInstanceOf(InvalidCredentialsError);
    expect(wrongPasswordError).toBeInstanceOf(InvalidCredentialsError);
    expect(unknownEmailError.message).toBe(wrongPasswordError.message);
  });
});
