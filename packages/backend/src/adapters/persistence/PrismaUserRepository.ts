import { PrismaClient } from '@prisma/client';
import { Email, User, UserId, UserRepository } from '@voyagin/domain';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id.toString() },
      create: {
        id: user.id.toString(),
        email: user.getEmail().toString(),
        name: user.getName(),
        hashedPassword: user.getHashedPassword(),
      },
      update: {
        email: user.getEmail().toString(),
        name: user.getName(),
        hashedPassword: user.getHashedPassword(),
      },
    });
  }

  async findById(id: UserId): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id: id.toString() } });
    return record
      ? User.reconstitute({
          id: record.id,
          email: Email.create(record.email),
          name: record.name,
          hashedPassword: record.hashedPassword,
        })
      : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email: email.toString() } });
    return record
      ? User.reconstitute({
          id: record.id,
          email: Email.create(record.email),
          name: record.name,
          hashedPassword: record.hashedPassword,
        })
      : null;
  }

  async delete(id: UserId): Promise<void> {
    await this.prisma.user.delete({ where: { id: id.toString() } });
  }
}
