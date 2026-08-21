import { randomUUID } from 'node:crypto';

export class PhotoId {
  private constructor(private readonly value: string) {}

  static create(value: string): PhotoId {
    return new PhotoId(value);
  }

  static generate(): PhotoId {
    return new PhotoId(randomUUID());
  }

  toString(): string {
    return this.value;
  }

  equals(other: PhotoId): boolean {
    return this.value === other.value;
  }
}
