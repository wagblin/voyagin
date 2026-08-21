import { chronologicalPhotoRoute, hasPhotoLocation } from '../photoLocations';
import type { Photo } from '../photosApi';

function buildPhoto(overrides: Partial<Photo>): Photo {
  return {
    id: 'photo-1',
    tripId: 'trip-1',
    uploaderId: 'user-1',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/photo.jpg',
    location: { latitude: 48.8566, longitude: 2.3522 },
    takenAt: '2026-09-01T10:00:00.000Z',
    caption: null,
    ...overrides,
  };
}

describe('hasPhotoLocation', () => {
  it('returns true when the photo has a location', () => {
    const photo = buildPhoto({ location: { latitude: 48.8566, longitude: 2.3522 } });

    expect(hasPhotoLocation(photo)).toBe(true);
  });

  it('returns false when the photo has no location', () => {
    const photo = buildPhoto({ location: null });

    expect(hasPhotoLocation(photo)).toBe(false);
  });
});

describe('chronologicalPhotoRoute', () => {
  it('returns an empty route for an empty photo list', () => {
    expect(chronologicalPhotoRoute([])).toEqual([]);
  });

  it('returns an empty route when no photo has a location', () => {
    const photos = [
      buildPhoto({ id: 'photo-1', location: null }),
      buildPhoto({ id: 'photo-2', location: null }),
    ];

    expect(chronologicalPhotoRoute(photos)).toEqual([]);
  });

  it('keeps only the photos that have a location', () => {
    const photos = [
      buildPhoto({
        id: 'photo-1',
        location: { latitude: 48.8566, longitude: 2.3522 },
        takenAt: '2026-09-01T10:00:00.000Z',
      }),
      buildPhoto({ id: 'photo-2', location: null, takenAt: '2026-09-01T11:00:00.000Z' }),
      buildPhoto({
        id: 'photo-3',
        location: { latitude: 45.764, longitude: 4.8357 },
        takenAt: '2026-09-01T12:00:00.000Z',
      }),
    ];

    expect(chronologicalPhotoRoute(photos)).toEqual([
      { latitude: 48.8566, longitude: 2.3522 },
      { latitude: 45.764, longitude: 4.8357 },
    ]);
  });

  it('orders the route chronologically regardless of the input order', () => {
    const photos = [
      buildPhoto({
        id: 'photo-latest',
        location: { latitude: 45.764, longitude: 4.8357 },
        takenAt: '2026-09-01T12:00:00.000Z',
      }),
      buildPhoto({
        id: 'photo-earliest',
        location: { latitude: 48.8566, longitude: 2.3522 },
        takenAt: '2026-09-01T10:00:00.000Z',
      }),
      buildPhoto({
        id: 'photo-middle',
        location: { latitude: 43.2965, longitude: 5.3698 },
        takenAt: '2026-09-01T11:00:00.000Z',
      }),
    ];

    expect(chronologicalPhotoRoute(photos)).toEqual([
      { latitude: 48.8566, longitude: 2.3522 },
      { latitude: 43.2965, longitude: 5.3698 },
      { latitude: 45.764, longitude: 4.8357 },
    ]);
  });

  it('does not throw when two photos share the exact same takenAt and keeps both points', () => {
    const photos = [
      buildPhoto({
        id: 'photo-a',
        location: { latitude: 48.8566, longitude: 2.3522 },
        takenAt: '2026-09-01T10:00:00.000Z',
      }),
      buildPhoto({
        id: 'photo-b',
        location: { latitude: 45.764, longitude: 4.8357 },
        takenAt: '2026-09-01T10:00:00.000Z',
      }),
    ];

    expect(() => chronologicalPhotoRoute(photos)).not.toThrow();
    const route = chronologicalPhotoRoute(photos);
    expect(route).toHaveLength(2);
    expect(route).toEqual(
      expect.arrayContaining([
        { latitude: 48.8566, longitude: 2.3522 },
        { latitude: 45.764, longitude: 4.8357 },
      ]),
    );
  });
});
