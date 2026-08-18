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

  it('removes a trip from the repository', async () => {
    const repository = new InMemoryTripRepository();
    const trip = Trip.create({ name: 'Bali sabbatical', ownerId: 'user-1', ownerName: 'Alex' });
    await repository.save(trip);

    await repository.delete(trip.id);

    expect(await repository.findById(trip.id)).toBeNull();
  });

  describe('findByParticipant', () => {
    it('returns the trips a user participates in', async () => {
      const repository = new InMemoryTripRepository();
      const trip = Trip.create({ name: 'Bali sabbatical', ownerId: 'user-1', ownerName: 'Alex' });
      await repository.save(trip);

      expect(await repository.findByParticipant('user-1')).toEqual([trip]);
    });

    it('returns an empty list when the user has no trips', async () => {
      const repository = new InMemoryTripRepository();

      expect(await repository.findByParticipant('user-1')).toEqual([]);
    });

    it('excludes trips the user does not participate in', async () => {
      const repository = new InMemoryTripRepository();
      const trip = Trip.create({ name: 'Bali sabbatical', ownerId: 'user-1', ownerName: 'Alex' });
      await repository.save(trip);

      expect(await repository.findByParticipant('user-2')).toEqual([]);
    });
  });
});
