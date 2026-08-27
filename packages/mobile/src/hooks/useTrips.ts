import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  addParticipant,
  createTrip,
  deleteTrip,
  getTrip,
  removeParticipant,
  updateTrip,
  type CreateTripInput,
  type Trip,
  type UpdateTripInput,
} from '../lib/tripsApi';

const tripsQueryKey = ['trips'] as const;
const tripQueryKey = (id: string) => ['trips', id] as const;

export function useTripQuery(id: string): UseQueryResult<Trip> {
  return useQuery({ queryKey: tripQueryKey(id), queryFn: () => getTrip(id) });
}

export function useCreateTripMutation(): UseMutationResult<Trip, Error, CreateTripInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTrip,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripsQueryKey });
    },
  });
}

export function useUpdateTripMutation(): UseMutationResult<Trip, Error, { id: string; input: UpdateTripInput }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => updateTrip(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripsQueryKey });
    },
  });
}

export function useDeleteTripMutation(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripsQueryKey });
    },
  });
}

export function useAddParticipantMutation(tripId: string): UseMutationResult<Trip, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => addParticipant(tripId, email),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripQueryKey(tripId) });
      void queryClient.invalidateQueries({ queryKey: tripsQueryKey });
    },
  });
}

export function useRemoveParticipantMutation(tripId: string): UseMutationResult<Trip, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeParticipant(tripId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripQueryKey(tripId) });
      void queryClient.invalidateQueries({ queryKey: tripsQueryKey });
    },
  });
}
