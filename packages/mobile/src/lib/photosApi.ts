import { authorizedFetch } from './apiClient';

export interface PhotoLocation {
  latitude: number;
  longitude: number;
}

export interface Photo {
  id: string;
  tripId: string;
  uploaderId: string;
  imageUrl: string;
  location: PhotoLocation | null;
  takenAt: string;
  caption: string | null;
}

export interface AddPhotoInput {
  uri: string;
  latitude?: number;
  longitude?: number;
  takenAt?: string;
  caption?: string;
}

export async function listTripPhotos(tripId: string): Promise<Photo[]> {
  const response = await authorizedFetch(`/api/trips/${tripId}/photos`);
  return (await response.json()) as Photo[];
}

export async function addPhoto(tripId: string, input: AddPhotoInput): Promise<Photo> {
  const formData = new FormData();
  // React Native's FormData accepts a { uri, name, type } file descriptor instead of a DOM
  // Blob/File — there's no type for it in the standard lib, hence the `as any` cast below.
  formData.append('image', { uri: input.uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
  if (input.latitude !== undefined && input.longitude !== undefined) {
    formData.append('latitude', String(input.latitude));
    formData.append('longitude', String(input.longitude));
  }
  if (input.takenAt !== undefined) {
    formData.append('takenAt', input.takenAt);
  }
  if (input.caption !== undefined) {
    formData.append('caption', input.caption);
  }

  const response = await authorizedFetch(`/api/trips/${tripId}/photos`, {
    method: 'POST',
    body: formData,
  });
  return (await response.json()) as Photo;
}

export async function deletePhoto(photoId: string): Promise<void> {
  await authorizedFetch(`/api/photos/${photoId}`, { method: 'DELETE' });
}
