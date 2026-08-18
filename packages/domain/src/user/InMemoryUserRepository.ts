import { User } from './User';
import { UserId } from './UserId';
import { Email } from './Email';
import { UserRepository } from './UserRepository';

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  save(user: User): Promise<void> {
    this.users.set(user.id.toString(), user);
    return Promise.resolve();
  }

  findById(id: UserId): Promise<User | null> {
    return Promise.resolve(this.users.get(id.toString()) ?? null);
  }

  findByEmail(email: Email): Promise<User | null> {
    const found = [...this.users.values()].find((user) => user.getEmail().equals(email));
    return Promise.resolve(found ?? null);
  }

  delete(id: UserId): Promise<void> {
    this.users.delete(id.toString());
    return Promise.resolve();
  }
}
