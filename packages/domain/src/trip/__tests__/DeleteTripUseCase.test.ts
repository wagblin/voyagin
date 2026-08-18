import { DeleteTripUseCase } from '../DeleteTripUseCase';
import { CreateTripUseCase } from '../CreateTripUseCase';
import { InMemoryTripRepository } from '../InMemoryTripRepository';
import { TripNotFoundError, NotTripOwnerError } from '../errors';

describe('DeleteTripUseCase', () => {
  const buildContext = async () => {
    const repository = new InMemoryTripRepository();
    const createTrip = new CreateTripUseCase(repository);
    const trip = await createTrip.execute({
      name: 'Bali sabbatical',
      ownerId: 'user-1',
      ownerName: 'Alex',
    });
    return { repository, trip, useCase: new DeleteTripUseCase(repository) };
  };

  it('deletes a trip when requested by its owner', async () => {
    const { repository, trip, useCase } = await buildContext();

    await useCase.execute({ tripId: trip.id.toString(), requesterId: 'user-1' });

    expect(await repository.findById(trip.id)).toBeNull();
  });

  it('rejects deleting a trip that does not exist', async () => {
    const repository = new InMemoryTripRepository();
    const useCase = new DeleteTripUseCase(repository);

    await expect(useCase.execute({ tripId: 'unknown', requesterId: 'user-1' })).rejects.toThrow(
      TripNotFoundError,
    );
  });

  it('rejects a deletion requested by someone who is not the owner', async () => {
    const { repository, trip, useCase } = await buildContext();

    await expect(
      useCase.execute({ tripId: trip.id.toString(), requesterId: 'user-2' }),
    ).rejects.toThrow(NotTripOwnerError);
    expect(await repository.findById(trip.id)).not.toBeNull();
  });
});
