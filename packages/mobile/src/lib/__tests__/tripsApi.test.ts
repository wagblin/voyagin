import { listTrips, getTrip, createTrip, updateTrip, deleteTrip, type Trip } from '../tripsApi';

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

  describe('listTrips', () => {
    it('resolves with the list of trips', async () => {
      mockFetchOnce({ ok: true, json: () => Promise.resolve([sampleTrip]) });

      await expect(listTrips()).resolves.toEqual([sampleTrip]);
    });

    it('throws when the API responds with an error', async () => {
      mockFetchOnce({ ok: false, status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) });

      await expect(listTrips()).rejects.toThrow('Unauthorized');
    });
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
});
