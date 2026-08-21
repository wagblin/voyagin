import { Photo } from './Photo';
import { PhotoId } from './PhotoId';
import { PhotoRepository } from './PhotoRepository';

export class InMemoryPhotoRepository implements PhotoRepository {
  private readonly photos = new Map<string, Photo>();

  save(photo: Photo): Promise<void> {
    this.photos.set(photo.id.toString(), photo);
    return Promise.resolve();
  }

  findById(id: PhotoId): Promise<Photo | null> {
    return Promise.resolve(this.photos.get(id.toString()) ?? null);
  }

  findByTrip(tripId: string): Promise<Photo[]> {
    const photos = [...this.photos.values()].filter((photo) => photo.getTripId() === tripId);
    return Promise.resolve(photos);
  }

  delete(id: PhotoId): Promise<void> {
    this.photos.delete(id.toString());
    return Promise.resolve();
  }
}
