import { RemovePhotoFromTripUseCase } from '../RemovePhotoFromTripUseCase';
import { AddPhotoToTripUseCase } from '../AddPhotoToTripUseCase';
import { InMemoryPhotoRepository } from '../InMemoryPhotoRepository';
import { PhotoNotFoundError, NotAllowedToDeletePhotoError } from '../errors';
import { CreateTripUseCase } from '../../trip/CreateTripUseCase';
import { InMemoryTripRepository } from '../../trip/InMemoryTripRepository';
import { AddParticipantToTripUseCase } from '../../trip/AddParticipantToTripUseCase';
import { InMemoryUserRepository } from '../../user/InMemoryUserRepository';
import { User } from '../../user/User';
import { Email } from '../../user/Email';
import { PhotoId } from '../PhotoId';
import { TripNotFoundError } from '../../trip/errors';

describe('RemovePhotoFromTripUseCase', () => {
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

    const addPhoto = new AddPhotoToTripUseCase(photoRepository, tripRepository);
    const photo = await addPhoto.execute({
      tripId: trip.id.toString(),
      uploaderId: participant.id.toString(),
      imageUrl: 'https://cdn.voyagin.app/photos/eiffel-tower.jpg',
      latitude: 48.8566,
      longitude: 2.3522,
      takenAt: new Date('2026-08-21T10:30:00Z'),
    });

    return {
      tripRepository,
      photoRepository,
      trip,
      participant,
      photo,
      useCase: new RemovePhotoFromTripUseCase(photoRepository, tripRepository),
    };
  };

  it('lets the uploader delete their own photo', async () => {
    const { photo, participant, photoRepository, useCase } = await buildContext();

    await useCase.execute({ photoId: photo.id.toString(), requesterId: participant.id.toString() });

    expect(await photoRepository.findById(photo.id)).toBeNull();
  });

  it('lets the trip owner delete a photo uploaded by another participant', async () => {
    const { photo, photoRepository, useCase } = await buildContext();

    await useCase.execute({ photoId: photo.id.toString(), requesterId: 'user-1' });

    expect(await photoRepository.findById(photo.id)).toBeNull();
  });

  it('rejects deleting a photo that does not exist', async () => {
    const { useCase } = await buildContext();

    await expect(
      useCase.execute({ photoId: PhotoId.generate().toString(), requesterId: 'user-1' }),
    ).rejects.toThrow(PhotoNotFoundError);
  });

  it('rejects a deletion requested by someone who is neither the uploader nor the trip owner', async () => {
    const { photo, photoRepository, useCase } = await buildContext();

    await expect(
      useCase.execute({ photoId: photo.id.toString(), requesterId: 'stranger' }),
    ).rejects.toThrow(NotAllowedToDeletePhotoError);
    expect(await photoRepository.findById(photo.id)).not.toBeNull();
  });

  it('rejects deleting a photo whose trip no longer exists', async () => {
    const { trip, photo, tripRepository, useCase } = await buildContext();
    await tripRepository.delete(trip.id);

    await expect(
      useCase.execute({ photoId: photo.id.toString(), requesterId: 'user-1' }),
    ).rejects.toThrow(TripNotFoundError);
  });
});
