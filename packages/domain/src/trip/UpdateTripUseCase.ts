import { Trip } from './Trip';
import { TripId } from './TripId';
import { DateRange } from './DateRange';
import { TripRepository } from './TripRepository';
import { TripNotFoundError } from './errors';

export interface UpdateTripInput {
  tripId: string;
  requesterId: string;
  name?: string;
  dateRange?: DateRange;
}

export class UpdateTripUseCase {
  constructor(private readonly tripRepository: TripRepository) {}

  async execute(input: UpdateTripInput): Promise<Trip> {
    const trip = await this.tripRepository.findById(TripId.create(input.tripId));
    if (!trip) {
      throw new TripNotFoundError(input.tripId);
    }

    if (input.name !== undefined) {
      trip.rename(input.name, input.requesterId);
    }

    if (input.dateRange !== undefined) {
      trip.adjustDateRange(input.dateRange, input.requesterId);
    }

    await this.tripRepository.save(trip);
    return trip;
  }
}
