import type { ParticipantRole, Trip, TripParticipant } from './tripsApi';

export interface TripRow {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantRow {
  id: string;
  userId: string;
  name: string;
  role: string;
  tripId: string;
}

export function mapPowerSyncRowsToTrips(tripRows: TripRow[], participantRows: ParticipantRow[]): Trip[] {
  return tripRows.map((tripRow) => ({
    id: tripRow.id,
    name: tripRow.name,
    dateRange:
      tripRow.startDate !== null && tripRow.endDate !== null
        ? { start: tripRow.startDate, end: tripRow.endDate }
        : null,
    participants: participantRows
      .filter((participant) => participant.tripId === tripRow.id)
      .map(
        (participant): TripParticipant => ({
          userId: participant.userId,
          name: participant.name,
          role: participant.role as ParticipantRole,
        }),
      ),
  }));
}
