import { InMemoryPhotoRepository } from '../InMemoryPhotoRepository';
import { PhotoId } from '../PhotoId';
import { Photo } from '../Photo';
import { GeoLocation } from '../GeoLocation';

describe('InMemoryPhotoRepository', () => {
  const buildPhoto = (tripId = 'trip-1') =>
    Photo.create({
      tripId,
      uploaderId: 'user-1',
      imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
      location: GeoLocation.create(48.8566, 2.3522),
      takenAt: new Date('2026-08-21T10:30:00Z'),
    });

  it('returns the photo that was saved', async () => {
    const repository = new InMemoryPhotoRepository();
    const photo = buildPhoto();

    await repository.save(photo);

    expect(await repository.findById(photo.id)).toBe(photo);
  });

  it('returns null when no photo matches the given id', async () => {
    const repository = new InMemoryPhotoRepository();

    expect(await repository.findById(PhotoId.create('unknown'))).toBeNull();
  });

  it('removes a photo from the repository', async () => {
    const repository = new InMemoryPhotoRepository();
    const photo = buildPhoto();
    await repository.save(photo);

    await repository.delete(photo.id);

    expect(await repository.findById(photo.id)).toBeNull();
  });

  describe('findByTrip', () => {
    it('returns the photos attached to a trip', async () => {
      const repository = new InMemoryPhotoRepository();
      const photo = buildPhoto('trip-1');
      await repository.save(photo);

      expect(await repository.findByTrip('trip-1')).toEqual([photo]);
    });

    it('returns an empty list when the trip has no photos', async () => {
      const repository = new InMemoryPhotoRepository();

      expect(await repository.findByTrip('trip-1')).toEqual([]);
    });

    it('excludes photos attached to another trip', async () => {
      const repository = new InMemoryPhotoRepository();
      const photo = buildPhoto('trip-1');
      await repository.save(photo);

      expect(await repository.findByTrip('trip-2')).toEqual([]);
    });
  });
});
