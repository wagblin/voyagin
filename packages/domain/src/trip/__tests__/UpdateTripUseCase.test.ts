import { UpdateTripUseCase } from '../UpdateTripUseCase';
import { CreateTripUseCase } from '../CreateTripUseCase';
import { InMemoryTripRepository } from '../InMemoryTripRepository';
import { DateRange } from '../DateRange';
import { TripNotFoundError, NotTripOwnerError } from '../errors';

describe('UpdateTripUseCase', () => {
  const buildContext = async () => {
    const repository = new InMemoryTripRepository();
    const createTrip = new CreateTripUseCase(repository);
    const trip = await createTrip.execute({
      name: 'Bali sabbatical',
      ownerId: 'user-1',
      ownerName: 'Alex',
    });
    return { repository, trip, useCase: new UpdateTripUseCase(repository) };
  };

  it('renames the trip when requested by its owner', async () => {
    const { repository, trip, useCase } = await buildContext();

    const updated = await useCase.execute({
      tripId: trip.id.toString(),
      requesterId: 'user-1',
      name: 'Bali honeymoon',
    });

    expect(updated.getName()).toBe('Bali honeymoon');
    expect((await repository.findById(trip.id))?.getName()).toBe('Bali honeymoon');
  });

  it('adjusts the date range when requested by its owner', async () => {
    const { trip, useCase } = await buildContext();
    const dateRange = DateRange.create(new Date('2026-09-01'), new Date('2026-09-15'));

    const updated = await useCase.execute({
      tripId: trip.id.toString(),
      requesterId: 'user-1',
      dateRange,
    });

    expect(updated.getDateRange()).toBe(dateRange);
  });

  it('leaves fields untouched when not provided', async () => {
    const { trip, useCase } = await buildContext();

    const updated = await useCase.execute({ tripId: trip.id.toString(), requesterId: 'user-1' });

    expect(updated.getName()).toBe('Bali sabbatical');
    expect(updated.getDateRange()).toBeUndefined();
  });

  it('rejects updating a trip that does not exist', async () => {
    const repository = new InMemoryTripRepository();
    const useCase = new UpdateTripUseCase(repository);

    await expect(
      useCase.execute({ tripId: 'unknown', requesterId: 'user-1', name: 'New name' }),
    ).rejects.toThrow(TripNotFoundError);
  });

  it('rejects an update requested by someone who is not the owner', async () => {
    const { trip, useCase } = await buildContext();

    await expect(
      useCase.execute({ tripId: trip.id.toString(), requesterId: 'user-2', name: 'New name' }),
    ).rejects.toThrow(NotTripOwnerError);
  });
});
