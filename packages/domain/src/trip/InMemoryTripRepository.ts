import { Trip } from './Trip';
import { TripId } from './TripId';
import { TripRepository } from './TripRepository';

export class InMemoryTripRepository implements TripRepository {
  private readonly trips = new Map<string, Trip>();

  save(trip: Trip): Promise<void> {
    this.trips.set(trip.id.toString(), trip);
    return Promise.resolve();
  }

  findById(id: TripId): Promise<Trip | null> {
    return Promise.resolve(this.trips.get(id.toString()) ?? null);
  }

  findByParticipant(userId: string): Promise<Trip[]> {
    const trips = [...this.trips.values()].filter((trip) =>
      trip.getParticipants().some((participant) => participant.userId === userId),
    );
    return Promise.resolve(trips);
  }

  delete(id: TripId): Promise<void> {
    this.trips.delete(id.toString());
    return Promise.resolve();
  }
}
