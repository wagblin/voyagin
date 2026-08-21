import { authorizedFetch } from './apiClient'

export interface PhotoLocation {
  latitude: number
  longitude: number
}

export interface Photo {
  id: string
  tripId: string
  uploaderId: string
  imageUrl: string
  location: PhotoLocation | null
  takenAt: string
  caption: string | null
}

export interface AddPhotoInput {
  file: File
  latitude?: number
  longitude?: number
  takenAt?: string
  caption?: string
}

export function listTripPhotos(tripId: string): Promise<Photo[]> {
  return authorizedFetch<Photo[]>(`/api/trips/${tripId}/photos`)
}

export function addPhoto(tripId: string, input: AddPhotoInput): Promise<Photo> {
  const formData = new FormData()
  formData.append('image', input.file)
  if (input.latitude !== undefined) {
    formData.append('latitude', String(input.latitude))
  }
  if (input.longitude !== undefined) {
    formData.append('longitude', String(input.longitude))
  }
  if (input.takenAt !== undefined) {
    formData.append('takenAt', input.takenAt)
  }
  if (input.caption !== undefined) {
    formData.append('caption', input.caption)
  }

  return authorizedFetch<Photo>(`/api/trips/${tripId}/photos`, {
    method: 'POST',
    body: formData,
  })
}

export function deletePhoto(photoId: string): Promise<void> {
  return authorizedFetch<void>(`/api/photos/${photoId}`, { method: 'DELETE' })
}
