import { addPhoto, deletePhoto, listTripPhotos, type Photo } from '../photosApi';

jest.mock('../authStorage', () => ({
  getToken: jest.fn().mockResolvedValue('test-token'),
}));

function mockFetchOnce(response: { ok: boolean; status?: number; json: () => Promise<unknown> }): void {
  global.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof fetch;
}

const samplePhoto: Photo = {
  id: 'photo-1',
  tripId: 'trip-1',
  uploaderId: 'user-1',
  imageUrl: 'https://cdn.example.com/photo-1.jpg',
  location: { latitude: 48.8566, longitude: 2.3522 },
  takenAt: '2026-08-20T10:00:00.000Z',
  caption: 'Tour Eiffel',
};

describe('photosApi', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('listTripPhotos', () => {
    it('resolves with the list of photos', async () => {
      mockFetchOnce({ ok: true, json: () => Promise.resolve([samplePhoto]) });

      await expect(listTripPhotos('trip-1')).resolves.toEqual([samplePhoto]);
    });

    it('throws when the user is not a participant', async () => {
      mockFetchOnce({ ok: false, status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) });

      await expect(listTripPhotos('trip-1')).rejects.toThrow('Forbidden');
    });
  });

  describe('addPhoto', () => {
    // Node's built-in FormData (used by this Jest environment) coerces appended values to
    // strings, unlike React Native's, which stores the { uri, name, type } object as-is. Spying
    // on `append` lets us assert what photosApi sends without depending on that runtime gap.
    function spyOnFormDataAppend() {
      return jest.spyOn(FormData.prototype, 'append');
    }

    it('resolves with the created photo and sends a multipart FormData body', async () => {
      const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(samplePhoto) });
      global.fetch = fetchMock as unknown as typeof fetch;
      const appendSpy = spyOnFormDataAppend();

      const result = await addPhoto('trip-1', {
        uri: 'file:///tmp/photo.jpg',
        latitude: 48.8566,
        longitude: 2.3522,
        takenAt: '2026-08-20T10:00:00.000Z',
        caption: 'Tour Eiffel',
      });

      expect(result).toEqual(samplePhoto);

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe('POST');
      expect(options.body).toBeInstanceOf(FormData);
      expect(appendSpy).toHaveBeenCalledWith('image', {
        uri: 'file:///tmp/photo.jpg',
        name: 'photo.jpg',
        type: 'image/jpeg',
      });
      expect(appendSpy).toHaveBeenCalledWith('latitude', '48.8566');
      expect(appendSpy).toHaveBeenCalledWith('longitude', '2.3522');
      expect(appendSpy).toHaveBeenCalledWith('takenAt', '2026-08-20T10:00:00.000Z');
      expect(appendSpy).toHaveBeenCalledWith('caption', 'Tour Eiffel');
    });

    it('omits optional fields when not provided', async () => {
      const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(samplePhoto) });
      global.fetch = fetchMock as unknown as typeof fetch;
      const appendSpy = spyOnFormDataAppend();

      await addPhoto('trip-1', { uri: 'file:///tmp/photo.jpg', latitude: 48.8566, longitude: 2.3522 });

      const appendedFields = appendSpy.mock.calls.map(([field]) => field);
      expect(appendedFields).not.toContain('takenAt');
      expect(appendedFields).not.toContain('caption');
    });

    it('throws when the user is not a participant', async () => {
      mockFetchOnce({ ok: false, status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) });

      await expect(
        addPhoto('trip-1', { uri: 'file:///tmp/photo.jpg', latitude: 48.8566, longitude: 2.3522 }),
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('deletePhoto', () => {
    it('resolves when the photo is deleted', async () => {
      mockFetchOnce({ ok: true, json: () => Promise.resolve({}) });

      await expect(deletePhoto('photo-1')).resolves.toBeUndefined();
    });

    it('throws when the user is neither the uploader nor the trip owner', async () => {
      mockFetchOnce({ ok: false, status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) });

      await expect(deletePhoto('photo-1')).rejects.toThrow('Forbidden');
    });
  });
});
