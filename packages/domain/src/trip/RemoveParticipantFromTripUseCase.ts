import { Trip } from './Trip';
import { TripId } from './TripId';
import { TripRepository } from './TripRepository';
import { TripNotFoundError } from './errors';

export interface RemoveParticipantFromTripInput {
  tripId: string;
  requesterId: string;
  participantUserId: string;
}

export class RemoveParticipantFromTripUseCase {
  constructor(private readonly tripRepository: TripRepository) {}

  async execute(input: RemoveParticipantFromTripInput): Promise<Trip> {
    const trip = await this.tripRepository.findById(TripId.create(input.tripId));
    if (!trip) {
      throw new TripNotFoundError(input.tripId);
    }

    trip.removeParticipant(input.participantUserId, input.requesterId);

    await this.tripRepository.save(trip);
    return trip;
  }
}
