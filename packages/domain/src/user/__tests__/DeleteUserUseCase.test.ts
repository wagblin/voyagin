import { DeleteUserUseCase } from '../DeleteUserUseCase';
import { InMemoryUserRepository } from '../InMemoryUserRepository';
import { User } from '../User';
import { Email } from '../Email';
import { UserNotFoundError } from '../errors';

describe('DeleteUserUseCase', () => {
  it('deletes an existing user through the repository port', async () => {
    const repository = new InMemoryUserRepository();
    const user = User.create({
      email: Email.create('alex@voyagin.app'),
      name: 'Alex',
      hashedPassword: 'hashed:s3cret123',
    });
    await repository.save(user);
    const useCase = new DeleteUserUseCase(repository);

    await useCase.execute({ userId: user.id.toString() });

    expect(await repository.findById(user.id)).toBeNull();
  });

  it('rejects deleting a user that does not exist', async () => {
    const repository = new InMemoryUserRepository();
    const useCase = new DeleteUserUseCase(repository);

    await expect(useCase.execute({ userId: 'unknown' })).rejects.toThrow(UserNotFoundError);
  });
});
