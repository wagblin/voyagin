import { fetchHealth } from '../healthApi';

describe('fetchHealth', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves with the health status when the API responds ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    }) as unknown as typeof fetch;

    await expect(fetchHealth()).resolves.toEqual({ status: 'ok' });
  });

  it('throws when the API responds with a non-ok status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;

    await expect(fetchHealth()).rejects.toThrow('Health check failed with status 500');
  });
});
