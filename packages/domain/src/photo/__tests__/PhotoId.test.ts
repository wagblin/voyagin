import { PhotoId } from '../PhotoId';

describe('PhotoId', () => {
  it('creates an id from an existing string value', () => {
    const id = PhotoId.create('photo-123');
    expect(id.toString()).toBe('photo-123');
  });

  it('generates a unique id when none is provided', () => {
    const a = PhotoId.generate();
    const b = PhotoId.generate();
    expect(a.toString()).not.toBe(b.toString());
  });

  it('considers two ids equal when their underlying value matches', () => {
    const a = PhotoId.create('photo-123');
    const b = PhotoId.create('photo-123');
    expect(a.equals(b)).toBe(true);
  });

  it('considers two ids different when their underlying value differs', () => {
    const a = PhotoId.create('photo-123');
    const b = PhotoId.create('photo-456');
    expect(a.equals(b)).toBe(false);
  });
});
