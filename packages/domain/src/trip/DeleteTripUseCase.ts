import { TripId } from './TripId';
import { TripRepository } from './TripRepository';
import { TripNotFoundError, NotTripOwnerError } from './errors';

export interface DeleteTripInput {
  tripId: string;
  requesterId: string;
}

export class DeleteTripUseCase {
  constructor(private readonly tripRepository: TripRepository) {}

  async execute(input: DeleteTripInput): Promise<void> {
    const trip = await this.tripRepository.findById(TripId.create(input.tripId));
    if (!trip) {
      throw new TripNotFoundError(input.tripId);
    }

    if (!trip.isOwnedBy(input.requesterId)) {
      throw new NotTripOwnerError(input.requesterId);
    }

    await this.tripRepository.delete(trip.id);
  }
}
