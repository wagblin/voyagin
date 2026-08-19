import { RemoveParticipantFromTripUseCase } from '../RemoveParticipantFromTripUseCase';
import { AddParticipantToTripUseCase } from '../AddParticipantToTripUseCase';
import { CreateTripUseCase } from '../CreateTripUseCase';
import { InMemoryTripRepository } from '../InMemoryTripRepository';
import { InMemoryUserRepository } from '../../user/InMemoryUserRepository';
import { User } from '../../user/User';
import { Email } from '../../user/Email';
import {
  TripNotFoundError,
  NotTripOwnerError,
  ParticipantNotFoundError,
  CannotRemoveOwnerError,
} from '../errors';

describe('RemoveParticipantFromTripUseCase', () => {
  const buildContext = async () => {
    const tripRepository = new InMemoryTripRepository();
    const userRepository = new InMemoryUserRepository();

    const createTrip = new CreateTripUseCase(tripRepository);
    const trip = await createTrip.execute({
      name: 'Bali sabbatical',
      ownerId: 'user-1',
      ownerName: 'Alex',
    });

    const participant = User.create({
      email: Email.create('sam@voyagin.app'),
      name: 'Sam',
      hashedPassword: 'hashed',
    });
    await userRepository.save(participant);

    const addParticipant = new AddParticipantToTripUseCase(tripRepository, userRepository);
    await addParticipant.execute({
      tripId: trip.id.toString(),
      requesterId: 'user-1',
      participantEmail: 'sam@voyagin.app',
    });

    return {
      tripRepository,
      trip,
      participant,
      useCase: new RemoveParticipantFromTripUseCase(tripRepository),
    };
  };

  it('removes a participant when requested by the trip owner', async () => {
    const { trip, participant, useCase } = await buildContext();

    const updated = await useCase.execute({
      tripId: trip.id.toString(),
      requesterId: 'user-1',
      participantUserId: participant.id.toString(),
    });

    expect(updated.getParticipants()).toHaveLength(1);
    expect(
      updated
        .getParticipants()
        .some((p) => p.userId === participant.id.toString()),
    ).toBe(false);
  });

  it('persists the updated trip through the repository', async () => {
    const { tripRepository, trip, participant, useCase } = await buildContext();

    await useCase.execute({
      tripId: trip.id.toString(),
      requesterId: 'user-1',
      participantUserId: participant.id.toString(),
    });

    const persisted = await tripRepository.findById(trip.id);
    expect(persisted?.getParticipants()).toHaveLength(1);
  });

  it('rejects removing a participant from a trip that does not exist', async () => {
    const { participant, useCase } = await buildContext();

    await expect(
      useCase.execute({
        tripId: 'unknown-trip',
        requesterId: 'user-1',
        participantUserId: participant.id.toString(),
      }),
    ).rejects.toThrow(TripNotFoundError);
  });

  it('rejects a removal requested by someone who is not the trip owner', async () => {
    const { trip, participant, useCase } = await buildContext();

    await expect(
      useCase.execute({
        tripId: trip.id.toString(),
        requesterId: participant.id.toString(),
        participantUserId: participant.id.toString(),
      }),
    ).rejects.toThrow(NotTripOwnerError);
  });

  it('rejects removing a user who is not a participant of the trip', async () => {
    const { trip, useCase } = await buildContext();

    await expect(
      useCase.execute({
        tripId: trip.id.toString(),
        requesterId: 'user-1',
        participantUserId: 'stranger',
      }),
    ).rejects.toThrow(ParticipantNotFoundError);
  });

  it('rejects removing the trip owner', async () => {
    const { trip, useCase } = await buildContext();

    await expect(
      useCase.execute({
        tripId: trip.id.toString(),
        requesterId: 'user-1',
        participantUserId: 'user-1',
      }),
    ).rejects.toThrow(CannotRemoveOwnerError);
  });
});
