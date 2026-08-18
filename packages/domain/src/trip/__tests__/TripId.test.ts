import { TripId } from '../TripId';

describe('TripId', () => {
  it('creates an id from an existing string value', () => {
    const id = TripId.create('trip-123');
    expect(id.toString()).toBe('trip-123');
  });

  it('generates a unique id when none is provided', () => {
    const a = TripId.generate();
    const b = TripId.generate();
    expect(a.toString()).not.toBe(b.toString());
  });

  it('considers two ids equal when their underlying value matches', () => {
    const a = TripId.create('trip-123');
    const b = TripId.create('trip-123');
    expect(a.equals(b)).toBe(true);
  });

  it('considers two ids different when their underlying value differs', () => {
    const a = TripId.create('trip-123');
    const b = TripId.create('trip-456');
    expect(a.equals(b)).toBe(false);
  });
});
