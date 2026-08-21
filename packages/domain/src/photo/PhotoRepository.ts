import { Photo } from './Photo';
import { PhotoId } from './PhotoId';

export interface PhotoRepository {
  save(photo: Photo): Promise<void>;
  findById(id: PhotoId): Promise<Photo | null>;
  findByTrip(tripId: string): Promise<Photo[]>;
  delete(id: PhotoId): Promise<void>;
}
