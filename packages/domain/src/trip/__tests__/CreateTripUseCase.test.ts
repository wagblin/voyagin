import { CreateTripUseCase } from '../CreateTripUseCase';
import { InMemoryTripRepository } from '../InMemoryTripRepository';
import { InvalidTripNameError } from '../errors';

describe('CreateTripUseCase', () => {
  it('creates a trip and persists it through the repository port', async () => {
    const repository = new InMemoryTripRepository();
    const useCase = new CreateTripUseCase(repository);

    const trip = await useCase.execute({
      name: 'Bali sabbatical',
      ownerId: 'user-1',
      ownerName: 'Alex',
    });

    const stored = await repository.findById(trip.id);
    expect(stored).toBe(trip);
  });

  it('propagates domain validation errors without persisting anything', async () => {
    const repository = new InMemoryTripRepository();
    const useCase = new CreateTripUseCase(repository);

    await expect(
      useCase.execute({ name: '  ', ownerId: 'user-1', ownerName: 'Alex' }),
    ).rejects.toThrow(InvalidTripNameError);
  });
});
