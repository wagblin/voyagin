import { authorizedFetch } from './apiClient'

export interface TripParticipant {
  userId: string
  name: string
  role: 'owner' | 'member'
}

export interface Trip {
  id: string
  name: string
  dateRange: { start: string; end: string } | null
  participants: TripParticipant[]
}

export interface CreateTripInput {
  name: string
}

export interface UpdateTripInput {
  name?: string
  startDate?: string
  endDate?: string
}

export function listTrips(): Promise<Trip[]> {
  return authorizedFetch<Trip[]>('/api/trips')
}

export function getTrip(id: string): Promise<Trip> {
  return authorizedFetch<Trip>(`/api/trips/${id}`)
}

export function createTrip(input: CreateTripInput): Promise<Trip> {
  return authorizedFetch<Trip>('/api/trips', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateTrip(id: string, input: UpdateTripInput): Promise<Trip> {
  return authorizedFetch<Trip>(`/api/trips/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteTrip(id: string): Promise<void> {
  return authorizedFetch<void>(`/api/trips/${id}`, { method: 'DELETE' })
}

export function addParticipant(tripId: string, email: string): Promise<Trip> {
  return authorizedFetch<Trip>(`/api/trips/${tripId}/participants`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function removeParticipant(tripId: string, userId: string): Promise<Trip> {
  return authorizedFetch<Trip>(`/api/trips/${tripId}/participants/${userId}`, {
    method: 'DELETE',
  })
}
