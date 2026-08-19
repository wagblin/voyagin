import { Trip } from './Trip';
import { TripId } from './TripId';
import { Participant } from './Participant';
import { TripRepository } from './TripRepository';
import { UserRepository } from '../user/UserRepository';
import { Email } from '../user/Email';
import { TripNotFoundError } from './errors';
import { UserNotFoundError } from '../user/errors';

export interface AddParticipantToTripInput {
  tripId: string;
  requesterId: string;
  participantEmail: string;
}

export class AddParticipantToTripUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: AddParticipantToTripInput): Promise<Trip> {
    const trip = await this.tripRepository.findById(TripId.create(input.tripId));
    if (!trip) {
      throw new TripNotFoundError(input.tripId);
    }

    const user = await this.userRepository.findByEmail(Email.create(input.participantEmail));
    if (!user) {
      throw new UserNotFoundError(input.participantEmail);
    }

    trip.addParticipant(Participant.create(user.id.toString(), user.getName()), input.requesterId);

    await this.tripRepository.save(trip);
    return trip;
  }
}
