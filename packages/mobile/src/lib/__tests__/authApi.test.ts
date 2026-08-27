import { register, login, logout, updateMe, deleteMe, fetchPowerSyncToken } from '../authApi';

jest.mock('../authStorage', () => ({
  getToken: jest.fn().mockResolvedValue('test-token'),
}));

function mockFetchOnce(response: { ok: boolean; status?: number; json: () => Promise<unknown> }): void {
  global.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof fetch;
}

describe('authApi', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('resolves with the token and user on success', async () => {
      const result = { token: 'abc', user: { id: '1', email: 'a@b.com', name: 'A' } };
      mockFetchOnce({ ok: true, json: () => Promise.resolve(result) });

      await expect(
        register({ email: 'a@b.com', name: 'A', password: 'password1' }),
      ).resolves.toEqual(result);
    });

    it('throws the error message when registration fails', async () => {
      mockFetchOnce({ ok: false, status: 409, json: () => Promise.resolve({ error: 'Email already taken' }) });

      await expect(
        register({ email: 'a@b.com', name: 'A', password: 'password1' }),
      ).rejects.toThrow('Email already taken');
    });
  });

  describe('login', () => {
    it('resolves with the token and user on success', async () => {
      const result = { token: 'abc', user: { id: '1', email: 'a@b.com', name: 'A' } };
      mockFetchOnce({ ok: true, json: () => Promise.resolve(result) });

      await expect(login({ email: 'a@b.com', password: 'password1' })).resolves.toEqual(result);
    });

    it('throws the error message on invalid credentials', async () => {
      mockFetchOnce({ ok: false, status: 401, json: () => Promise.resolve({ error: 'Invalid credentials' }) });

      await expect(login({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('resolves when the API confirms logout', async () => {
      mockFetchOnce({ ok: true, json: () => Promise.resolve({}) });

      await expect(logout()).resolves.toBeUndefined();
    });

    it('throws when the API rejects the request', async () => {
      mockFetchOnce({ ok: false, status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) });

      await expect(logout()).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateMe', () => {
    it('resolves with the updated user on success', async () => {
      const user = { id: '1', email: 'new@b.com', name: 'New Name' };
      mockFetchOnce({ ok: true, json: () => Promise.resolve(user) });

      await expect(updateMe({ name: 'New Name' })).resolves.toEqual(user);
    });

    it('throws the error message when the update fails', async () => {
      mockFetchOnce({ ok: false, status: 400, json: () => Promise.resolve({ error: 'Invalid input' }) });

      await expect(updateMe({ email: 'not-an-email' })).rejects.toThrow('Invalid input');
    });
  });

  describe('deleteMe', () => {
    it('resolves when the account is deleted', async () => {
      mockFetchOnce({ ok: true, json: () => Promise.resolve({}) });

      await expect(deleteMe()).resolves.toBeUndefined();
    });

    it('throws when the API rejects the request', async () => {
      mockFetchOnce({ ok: false, status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) });

      await expect(deleteMe()).rejects.toThrow('Unauthorized');
    });
  });

  describe('fetchPowerSyncToken', () => {
    it('resolves with a short-lived PowerSync-scoped token, exchanged for the current session token', async () => {
      mockFetchOnce({ ok: true, json: () => Promise.resolve({ token: 'powersync-scoped-token' }) });

      await expect(fetchPowerSyncToken()).resolves.toEqual({ token: 'powersync-scoped-token' });
    });

    it('throws when the API rejects the exchange (expired or invalid session token)', async () => {
      mockFetchOnce({ ok: false, status: 401, json: () => Promise.resolve({ error: 'Invalid or expired token.' }) });

      await expect(fetchPowerSyncToken()).rejects.toThrow('Invalid or expired token.');
    });
  });
});
