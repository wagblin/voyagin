import { InMemoryTripRepository } from '../InMemoryTripRepository';
import { TripId } from '../TripId';
import { Trip } from '../Trip';

describe('InMemoryTripRepository', () => {
  it('returns the trip that was saved', async () => {
    const repository = new InMemoryTripRepository();
    const trip = Trip.create({ name: 'Bali sabbatical', ownerId: 'user-1', ownerName: 'Alex' });

    await repository.save(trip);

    expect(await repository.findById(trip.id)).toBe(trip);
  });

  it('returns null when no trip matches the given id', async () => {
    const repository = new InMemoryTripRepository();

    expect(await repository.findById(TripId.create('unknown'))).toBeNull();
  });
});
