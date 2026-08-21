import { AddPhotoToTripUseCase } from '../AddPhotoToTripUseCase';
import { InMemoryPhotoRepository } from '../InMemoryPhotoRepository';
import { NotTripParticipantError } from '../errors';
import { CreateTripUseCase } from '../../trip/CreateTripUseCase';
import { InMemoryTripRepository } from '../../trip/InMemoryTripRepository';
import { AddParticipantToTripUseCase } from '../../trip/AddParticipantToTripUseCase';
import { InMemoryUserRepository } from '../../user/InMemoryUserRepository';
import { User } from '../../user/User';
import { Email } from '../../user/Email';
import { TripNotFoundError } from '../../trip/errors';
import { IncompleteGeoLocationError, InvalidGeoLocationError } from '../errors';

describe('AddPhotoToTripUseCase', () => {
  const buildContext = async () => {
    const tripRepository = new InMemoryTripRepository();
    const userRepository = new InMemoryUserRepository();
    const photoRepository = new InMemoryPhotoRepository();

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
      photoRepository,
      trip,
      participant,
      useCase: new AddPhotoToTripUseCase(photoRepository, tripRepository),
    };
  };

  it('lets a participant capture a photo on the shared live journal of the trip', async () => {
    const { trip, participant, useCase } = await buildContext();

    const photo = await useCase.execute({
      tripId: trip.id.toString(),
      uploaderId: participant.id.toString(),
      imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
      latitude: 48.8566,
      longitude: 2.3522,
      takenAt: new Date('2026-08-21T10:30:00Z'),
    });

    expect(photo.getTripId()).toBe(trip.id.toString());
    expect(photo.getUploaderId()).toBe(participant.id.toString());
    // A latitude/longitude pair was provided above, so the location is guaranteed to be defined here.
    expect(photo.getLocation()!.latitude).toBe(48.8566);
  });

  it('lets the trip owner capture a photo too', async () => {
    const { trip, useCase } = await buildContext();

    const photo = await useCase.execute({
      tripId: trip.id.toString(),
      uploaderId: 'user-1',
      imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
      latitude: 48.8566,
      longitude: 2.3522,
      takenAt: new Date('2026-08-21T10:30:00Z'),
    });

    expect(photo.getUploaderId()).toBe('user-1');
  });

  it('accepts an optional caption', async () => {
    const { trip, participant, useCase } = await buildContext();

    const photo = await useCase.execute({
      tripId: trip.id.toString(),
      uploaderId: participant.id.toString(),
      imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
      latitude: 48.8566,
      longitude: 2.3522,
      takenAt: new Date('2026-08-21T10:30:00Z'),
      caption: 'Golden hour',
    });

    expect(photo.getCaption()).toBe('Golden hour');
  });

  it('persists the photo through the repository', async () => {
    const { trip, participant, photoRepository, useCase } = await buildContext();

    const photo = await useCase.execute({
      tripId: trip.id.toString(),
      uploaderId: participant.id.toString(),
      imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
      latitude: 48.8566,
      longitude: 2.3522,
      takenAt: new Date('2026-08-21T10:30:00Z'),
    });

    expect(await photoRepository.findById(photo.id)).toBe(photo);
  });

  it('rejects adding a photo to a trip that does not exist', async () => {
    const { participant, useCase } = await buildContext();

    await expect(
      useCase.execute({
        tripId: 'unknown-trip',
        uploaderId: participant.id.toString(),
        imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
        latitude: 48.8566,
        longitude: 2.3522,
        takenAt: new Date('2026-08-21T10:30:00Z'),
      }),
    ).rejects.toThrow(TripNotFoundError);
  });

  it('rejects a photo captured by someone who has not joined the trip', async () => {
    const { trip, useCase } = await buildContext();

    await expect(
      useCase.execute({
        tripId: trip.id.toString(),
        uploaderId: 'stranger',
        imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
        latitude: 48.8566,
        longitude: 2.3522,
        takenAt: new Date('2026-08-21T10:30:00Z'),
      }),
    ).rejects.toThrow(NotTripParticipantError);
  });

  it('lets a participant capture a photo with no geolocation at all', async () => {
    const { trip, participant, useCase } = await buildContext();

    const photo = await useCase.execute({
      tripId: trip.id.toString(),
      uploaderId: participant.id.toString(),
      imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
      latitude: undefined,
      longitude: undefined,
      takenAt: new Date('2026-08-21T10:30:00Z'),
    });

    expect(photo.getLocation()).toBeUndefined();
  });

  it('rejects a photo with only a latitude and no longitude', async () => {
    const { trip, participant, useCase } = await buildContext();

    await expect(
      useCase.execute({
        tripId: trip.id.toString(),
        uploaderId: participant.id.toString(),
        imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
        latitude: 48.8566,
        longitude: undefined,
        takenAt: new Date('2026-08-21T10:30:00Z'),
      }),
    ).rejects.toThrow(IncompleteGeoLocationError);
  });

  it('rejects a photo with only a longitude and no latitude', async () => {
    const { trip, participant, useCase } = await buildContext();

    await expect(
      useCase.execute({
        tripId: trip.id.toString(),
        uploaderId: participant.id.toString(),
        imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
        latitude: undefined,
        longitude: 2.3522,
        takenAt: new Date('2026-08-21T10:30:00Z'),
      }),
    ).rejects.toThrow(IncompleteGeoLocationError);
  });

  it('rejects a photo with an out-of-range geolocation', async () => {
    const { trip, participant, useCase } = await buildContext();

    await expect(
      useCase.execute({
        tripId: trip.id.toString(),
        uploaderId: participant.id.toString(),
        imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
        latitude: 200,
        longitude: 2.3522,
        takenAt: new Date('2026-08-21T10:30:00Z'),
      }),
    ).rejects.toThrow(InvalidGeoLocationError);
  });
});
