import { Trip } from './Trip';
import { TripRepository } from './TripRepository';

export interface CreateTripInput {
  name: string;
  ownerId: string;
  ownerName: string;
}

export class CreateTripUseCase {
  constructor(private readonly tripRepository: TripRepository) {}

  async execute(input: CreateTripInput): Promise<Trip> {
    const trip = Trip.create(input);
    await this.tripRepository.save(trip);
    return trip;
  }
}
