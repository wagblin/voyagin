import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as tripsApi from '@/lib/tripsApi'

const tripsKey = ['trips'] as const
const tripKey = (id: string) => ['trips', id] as const

export function useTripsQuery() {
  return useQuery({ queryKey: tripsKey, queryFn: tripsApi.listTrips })
}

export function useTripQuery(id: string) {
  return useQuery({ queryKey: tripKey(id), queryFn: () => tripsApi.getTrip(id) })
}

export function useCreateTripMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: tripsApi.createTrip,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripsKey })
    },
  })
}

export function useUpdateTripMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: tripsApi.UpdateTripInput) => tripsApi.updateTrip(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripsKey })
      void queryClient.invalidateQueries({ queryKey: tripKey(id) })
    },
  })
}

export function useDeleteTripMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tripsApi.deleteTrip(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripsKey })
    },
  })
}
