import { Trip } from './Trip';
import { TripId } from './TripId';

export interface TripRepository {
  save(trip: Trip): Promise<void>;
  findById(id: TripId): Promise<Trip | null>;
}
