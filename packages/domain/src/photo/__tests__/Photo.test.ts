import { Photo } from '../Photo';
import { GeoLocation } from '../GeoLocation';
import { InvalidImageUrlError, InvalidTripIdError, InvalidUploaderIdError } from '../errors';

describe('Photo', () => {
  const location = GeoLocation.create(48.8566, 2.3522);
  const takenAt = new Date('2026-08-21T10:30:00Z');
  const baseProps = {
    tripId: 'trip-1',
    uploaderId: 'user-1',
    imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
    location,
    takenAt,
  };

  describe('create', () => {
    it('creates a photo attached to a trip, timestamped and geolocated', () => {
      const photo = Photo.create(baseProps);

      expect(photo.getTripId()).toBe('trip-1');
      expect(photo.getUploaderId()).toBe('user-1');
      expect(photo.getImageUrl()).toBe('https://cdn.voyagin.app/photos/eiffel-tower.jpg');
      expect(photo.getLocation()).toBe(location);
      expect(photo.getTakenAt()).toBe(takenAt);
    });

    it('generates a unique id for each new photo', () => {
      const a = Photo.create(baseProps);
      const b = Photo.create(baseProps);
      expect(a.id.equals(b.id)).toBe(false);
    });

    it('accepts an optional caption', () => {
      const photo = Photo.create({ ...baseProps, caption: 'Golden hour at the Eiffel Tower' });
      expect(photo.getCaption()).toBe('Golden hour at the Eiffel Tower');
    });

    it('leaves the caption undefined when none is provided', () => {
      const photo = Photo.create(baseProps);
      expect(photo.getCaption()).toBeUndefined();
    });

    it('rejects an empty image url', () => {
      expect(() => Photo.create({ ...baseProps, imageUrl: '' })).toThrow(InvalidImageUrlError);
    });

    it('rejects an empty trip id', () => {
      expect(() => Photo.create({ ...baseProps, tripId: '' })).toThrow(InvalidTripIdError);
    });

    it('rejects an empty uploader id', () => {
      expect(() => Photo.create({ ...baseProps, uploaderId: '' })).toThrow(InvalidUploaderIdError);
    });
  });

  describe('reconstitute', () => {
    it('rebuilds a photo from previously persisted data without re-validating invariants', () => {
      const photo = Photo.reconstitute({
        id: 'photo-123',
        tripId: 'trip-1',
        uploaderId: 'user-1',
        imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
        location,
        takenAt,
        caption: 'Golden hour at the Eiffel Tower',
      });

      expect(photo.id.toString()).toBe('photo-123');
      expect(photo.getTripId()).toBe('trip-1');
      expect(photo.getUploaderId()).toBe('user-1');
      expect(photo.getImageUrl()).toBe('https://cdn.voyagin.app/photos/eiffel-tower.jpg');
      expect(photo.getLocation()).toBe(location);
      expect(photo.getTakenAt()).toBe(takenAt);
      expect(photo.getCaption()).toBe('Golden hour at the Eiffel Tower');
    });

    it('rebuilds a photo that has no caption', () => {
      const photo = Photo.reconstitute({
        id: 'photo-123',
        tripId: 'trip-1',
        uploaderId: 'user-1',
        imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
        location,
        takenAt,
      });

      expect(photo.getCaption()).toBeUndefined();
    });
  });
});
