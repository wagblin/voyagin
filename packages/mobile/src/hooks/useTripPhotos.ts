import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { addPhoto, deletePhoto, listTripPhotos, type AddPhotoInput, type Photo } from '../lib/photosApi';

const tripPhotosQueryKey = (tripId: string) => ['trips', tripId, 'photos'] as const;

export function useTripPhotosQuery(tripId: string): UseQueryResult<Photo[]> {
  return useQuery({ queryKey: tripPhotosQueryKey(tripId), queryFn: () => listTripPhotos(tripId) });
}

export function useAddPhotoMutation(tripId: string): UseMutationResult<Photo, Error, AddPhotoInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddPhotoInput) => addPhoto(tripId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripPhotosQueryKey(tripId) });
    },
  });
}

export function useDeletePhotoMutation(tripId: string): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => deletePhoto(photoId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripPhotosQueryKey(tripId) });
    },
  });
}
