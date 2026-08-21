import type { Photo, PhotoLocation } from './photosApi';

export function hasPhotoLocation(photo: Photo): photo is Photo & { location: PhotoLocation } {
  return photo.location !== null;
}

export function chronologicalPhotoRoute(photos: Photo[]): PhotoLocation[] {
  return photos
    .filter(hasPhotoLocation)
    .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime())
    .map((photo) => photo.location);
}
