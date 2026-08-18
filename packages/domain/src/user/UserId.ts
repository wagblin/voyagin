import { randomUUID } from 'node:crypto';

export class UserId {
  private constructor(private readonly value: string) {}

  static create(value: string): UserId {
    return new UserId(value);
  }

  static generate(): UserId {
    return new UserId(randomUUID());
  }

  toString(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
