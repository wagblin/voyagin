import { AddParticipantToTripUseCase } from '../AddParticipantToTripUseCase';
import { CreateTripUseCase } from '../CreateTripUseCase';
import { InMemoryTripRepository } from '../InMemoryTripRepository';
import { InMemoryUserRepository } from '../../user/InMemoryUserRepository';
import { User } from '../../user/User';
import { Email } from '../../user/Email';
import { TripNotFoundError, NotTripOwnerError, DuplicateParticipantError } from '../errors';
import { UserNotFoundError } from '../../user/errors';

describe('AddParticipantToTripUseCase', () => {
  const buildContext = async () => {
    const tripRepository = new InMemoryTripRepository();
    const userRepository = new InMemoryUserRepository();

    const createTrip = new CreateTripUseCase(tripRepository);
    const trip = await createTrip.execute({
      name: 'Bali sabbatical',
      ownerId: 'user-1',
      ownerName: 'Alex',
    });

    const invitee = User.create({
      email: Email.create('sam@voyagin.app'),
      name: 'Sam',
      hashedPassword: 'hashed',
    });
    await userRepository.save(invitee);

    return {
      tripRepository,
      userRepository,
      trip,
      invitee,
      useCase: new AddParticipantToTripUseCase(tripRepository, userRepository),
    };
  };

  it("adds an existing user as a participant of the owner's trip, identified by email", async () => {
    const { trip, invitee, useCase } = await buildContext();

    const updated = await useCase.execute({
      tripId: trip.id.toString(),
      requesterId: 'user-1',
      participantEmail: 'sam@voyagin.app',
    });

    expect(updated.getParticipants()).toHaveLength(2);
    expect(
      updated
        .getParticipants()
        .some((participant) => participant.userId === invitee.id.toString()),
    ).toBe(true);
  });

  it('persists the updated trip through the repository', async () => {
    const { tripRepository, trip, invitee, useCase } = await buildContext();

    await useCase.execute({
      tripId: trip.id.toString(),
      requesterId: 'user-1',
      participantEmail: 'sam@voyagin.app',
    });

    const persisted = await tripRepository.findById(trip.id);
    expect(
      persisted?.getParticipants().some((participant) => participant.userId === invitee.id.toString()),
    ).toBe(true);
  });

  it('rejects adding a participant to a trip that does not exist', async () => {
    const { userRepository, useCase } = await buildContext();
    void userRepository;

    await expect(
      useCase.execute({
        tripId: 'unknown-trip',
        requesterId: 'user-1',
        participantEmail: 'sam@voyagin.app',
      }),
    ).rejects.toThrow(TripNotFoundError);
  });

  it('rejects adding a participant when no user is registered with that email', async () => {
    const { trip, useCase } = await buildContext();

    await expect(
      useCase.execute({
        tripId: trip.id.toString(),
        requesterId: 'user-1',
        participantEmail: 'ghost@voyagin.app',
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('rejects a request made by someone who is not the trip owner', async () => {
    const { trip, useCase } = await buildContext();

    await expect(
      useCase.execute({
        tripId: trip.id.toString(),
        requesterId: 'not-the-owner',
        participantEmail: 'sam@voyagin.app',
      }),
    ).rejects.toThrow(NotTripOwnerError);
  });

  it('rejects adding a user who has already joined the trip', async () => {
    const { trip, useCase } = await buildContext();

    await useCase.execute({
      tripId: trip.id.toString(),
      requesterId: 'user-1',
      participantEmail: 'sam@voyagin.app',
    });

    await expect(
      useCase.execute({
        tripId: trip.id.toString(),
        requesterId: 'user-1',
        participantEmail: 'sam@voyagin.app',
      }),
    ).rejects.toThrow(DuplicateParticipantError);
  });
});
