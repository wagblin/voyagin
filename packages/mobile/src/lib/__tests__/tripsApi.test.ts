import {
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  addParticipant,
  removeParticipant,
  type Trip,
} from '../tripsApi';

jest.mock('../authStorage', () => ({
  getToken: jest.fn().mockResolvedValue('test-token'),
}));

function mockFetchOnce(response: { ok: boolean; status?: number; json: () => Promise<unknown> }): void {
  global.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof fetch;
}

const sampleTrip: Trip = {
  id: 'trip-1',
  name: 'Roadtrip',
  dateRange: null,
  participants: [{ userId: 'user-1', name: 'Alice', role: 'owner' }],
};

describe('tripsApi', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getTrip', () => {
    it('resolves with the trip', async () => {
      mockFetchOnce({ ok: true, json: () => Promise.resolve(sampleTrip) });

      await expect(getTrip('trip-1')).resolves.toEqual(sampleTrip);
    });

    it('throws when the trip does not exist', async () => {
      mockFetchOnce({ ok: false, status: 404, json: () => Promise.resolve({ error: 'Trip not found' }) });

      await expect(getTrip('missing')).rejects.toThrow('Trip not found');
    });
  });

  describe('createTrip', () => {
    it('resolves with the created trip', async () => {
      mockFetchOnce({ ok: true, json: () => Promise.resolve(sampleTrip) });

      await expect(createTrip({ name: 'Roadtrip' })).resolves.toEqual(sampleTrip);
    });

    it('throws when validation fails', async () => {
      mockFetchOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { fieldErrors: { name: ['Required'] }, formErrors: [] } }),
      });

      await expect(createTrip({ name: '' })).rejects.toThrow();
    });
  });

  describe('updateTrip', () => {
    it('resolves with the updated trip', async () => {
      const updated = { ...sampleTrip, name: 'New name' };
      mockFetchOnce({ ok: true, json: () => Promise.resolve(updated) });

      await expect(updateTrip('trip-1', { name: 'New name' })).resolves.toEqual(updated);
    });

    it('throws when the user is not the owner', async () => {
      mockFetchOnce({ ok: false, status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) });

      await expect(updateTrip('trip-1', { name: 'New name' })).rejects.toThrow('Forbidden');
    });
  });

  describe('deleteTrip', () => {
    it('resolves when the trip is deleted', async () => {
      mockFetchOnce({ ok: true, json: () => Promise.resolve({}) });

      await expect(deleteTrip('trip-1')).resolves.toBeUndefined();
    });

    it('throws when the trip does not exist', async () => {
      mockFetchOnce({ ok: false, status: 404, json: () => Promise.resolve({ error: 'Trip not found' }) });

      await expect(deleteTrip('missing')).rejects.toThrow('Trip not found');
    });
  });

  describe('addParticipant', () => {
    it('resolves with the updated trip', async () => {
      const updated = {
        ...sampleTrip,
        participants: [...sampleTrip.participants, { userId: 'user-2', name: 'Bob', role: 'member' as const }],
      };
      mockFetchOnce({ ok: true, json: () => Promise.resolve(updated) });

      await expect(addParticipant('trip-1', 'bob@example.com')).resolves.toEqual(updated);
    });

    it('throws when no account matches the email', async () => {
      mockFetchOnce({ ok: false, status: 404, json: () => Promise.resolve({ error: 'User not found' }) });

      await expect(addParticipant('trip-1', 'unknown@example.com')).rejects.toThrow('User not found');
    });
  });

  describe('removeParticipant', () => {
    it('resolves with the updated trip', async () => {
      const updated = { ...sampleTrip, participants: [] };
      mockFetchOnce({ ok: true, json: () => Promise.resolve(updated) });

      await expect(removeParticipant('trip-1', 'user-2')).resolves.toEqual(updated);
    });

    it('throws when attempting to remove the owner', async () => {
      mockFetchOnce({ ok: false, status: 409, json: () => Promise.resolve({ error: 'Cannot remove owner' }) });

      await expect(removeParticipant('trip-1', 'user-1')).rejects.toThrow('Cannot remove owner');
    });
  });
});
