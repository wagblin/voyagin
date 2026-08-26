import { pickBestLocation } from '../pickBestLocation';

describe('pickBestLocation', () => {
  it('returns the first location when it is not null', () => {
    const a = { latitude: 48.8566, longitude: 2.3522 };
    const b = { latitude: 40.7128, longitude: -74.006 };
    expect(pickBestLocation(a, b)).toBe(a);
  });

  it('falls back to the second location when the first is null', () => {
    const b = { latitude: 40.7128, longitude: -74.006 };
    expect(pickBestLocation(null, b)).toBe(b);
  });

  it('returns null when both locations are null', () => {
    expect(pickBestLocation(null, null)).toBeNull();
  });
});
