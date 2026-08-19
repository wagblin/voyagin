import { authorizedFetch } from './apiClient';

export type ParticipantRole = 'owner' | 'member';

export interface TripParticipant {
  userId: string;
  name: string;
  role: ParticipantRole;
}

export interface TripDateRange {
  start: string;
  end: string;
}

export interface Trip {
  id: string;
  name: string;
  dateRange: TripDateRange | null;
  participants: TripParticipant[];
}

export interface CreateTripInput {
  name: string;
}

export interface UpdateTripInput {
  name?: string;
  startDate?: string;
  endDate?: string;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export async function listTrips(): Promise<Trip[]> {
  const response = await authorizedFetch('/api/trips');
  return (await response.json()) as Trip[];
}

export async function getTrip(id: string): Promise<Trip> {
  const response = await authorizedFetch(`/api/trips/${id}`);
  return (await response.json()) as Trip;
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const response = await authorizedFetch('/api/trips', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
  return (await response.json()) as Trip;
}

export async function updateTrip(id: string, input: UpdateTripInput): Promise<Trip> {
  const response = await authorizedFetch(`/api/trips/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
  return (await response.json()) as Trip;
}

export async function deleteTrip(id: string): Promise<void> {
  await authorizedFetch(`/api/trips/${id}`, { method: 'DELETE' });
}

export async function addParticipant(tripId: string, email: string): Promise<Trip> {
  const response = await authorizedFetch(`/api/trips/${tripId}/participants`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email }),
  });
  return (await response.json()) as Trip;
}

export async function removeParticipant(tripId: string, userId: string): Promise<Trip> {
  const response = await authorizedFetch(`/api/trips/${tripId}/participants/${userId}`, {
    method: 'DELETE',
  });
  return (await response.json()) as Trip;
}
