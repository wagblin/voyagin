import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as photosApi from '@/lib/photosApi'

const tripPhotosKey = (tripId: string) => ['trips', tripId, 'photos'] as const

export function useTripPhotosQuery(tripId: string) {
  return useQuery({ queryKey: tripPhotosKey(tripId), queryFn: () => photosApi.listTripPhotos(tripId) })
}

export function useAddPhotoMutation(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: photosApi.AddPhotoInput) => photosApi.addPhoto(tripId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripPhotosKey(tripId) })
    },
  })
}

export function useDeletePhotoMutation(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (photoId: string) => photosApi.deletePhoto(photoId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripPhotosKey(tripId) })
    },
  })
}
