import { PowerSyncConnector } from '../powerSyncConnector';
import { getToken } from '../../authStorage';
import { fetchPowerSyncToken } from '../../authApi';

jest.mock('../../authStorage', () => ({
  getToken: jest.fn(),
}));

jest.mock('../../authApi', () => ({
  fetchPowerSyncToken: jest.fn(),
}));

describe('PowerSyncConnector', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchCredentials', () => {
    it('returns null without calling the API when there is no session token (unauthenticated)', async () => {
      (getToken as jest.Mock).mockResolvedValue(null);
      const connector = new PowerSyncConnector();

      const credentials = await connector.fetchCredentials();

      expect(credentials).toBeNull();
      expect(fetchPowerSyncToken).not.toHaveBeenCalled();
    });

    it('exchanges the session token for a dedicated PowerSync token via the backend endpoint', async () => {
      (getToken as jest.Mock).mockResolvedValue('session-token');
      (fetchPowerSyncToken as jest.Mock).mockResolvedValue({ token: 'powersync-scoped-token' });
      const connector = new PowerSyncConnector();

      const credentials = await connector.fetchCredentials();

      expect(credentials).toEqual({
        endpoint: 'https://6a90523c02481fb31b918cee.powersync.journeyapps.com',
        token: 'powersync-scoped-token',
      });
    });

    it('returns null when exchanging the session token for a PowerSync token fails', async () => {
      (getToken as jest.Mock).mockResolvedValue('session-token');
      (fetchPowerSyncToken as jest.Mock).mockRejectedValue(new Error('Invalid or expired token.'));
      const connector = new PowerSyncConnector();

      const credentials = await connector.fetchCredentials();

      expect(credentials).toBeNull();
    });
  });
});
