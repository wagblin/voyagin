import { randomUUID } from 'node:crypto';

export class TripId {
  private constructor(private readonly value: string) {}

  static create(value: string): TripId {
    return new TripId(value);
  }

  static generate(): TripId {
    return new TripId(randomUUID());
  }

  toString(): string {
    return this.value;
  }

  equals(other: TripId): boolean {
    return this.value === other.value;
  }
}
