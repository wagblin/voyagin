import { UserId } from '../UserId';

describe('UserId', () => {
  it('creates an id from an existing string value', () => {
    const id = UserId.create('user-123');
    expect(id.toString()).toBe('user-123');
  });

  it('generates a unique id when none is provided', () => {
    const a = UserId.generate();
    const b = UserId.generate();
    expect(a.toString()).not.toBe(b.toString());
  });

  it('considers two ids equal when their underlying value matches', () => {
    const a = UserId.create('user-123');
    const b = UserId.create('user-123');
    expect(a.equals(b)).toBe(true);
  });

  it('considers two ids different when their underlying value differs', () => {
    const a = UserId.create('user-123');
    const b = UserId.create('user-456');
    expect(a.equals(b)).toBe(false);
  });
});
