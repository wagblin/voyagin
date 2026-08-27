import jwt from 'jsonwebtoken';
import { PowerSyncTokenService } from '../PowerSyncTokenService';

const instanceUrl = 'https://test-instance.powersync.journeyapps.com';

describe('PowerSyncTokenService', () => {
  const service = new PowerSyncTokenService('test-secret', instanceUrl);

  it('issues a token whose subject is the given user id', () => {
    const token = service.issue('user-1');
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    expect(decoded.sub).toBe('user-1');
  });

  it('stamps the token with the PowerSync instance URL as its audience, as PowerSync Cloud requires (PSYNC_S2105)', () => {
    const token = service.issue('user-1');
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    expect(decoded.aud).toBe(instanceUrl);
  });

  it('signs the token so it verifies against the shared secret', () => {
    const token = service.issue('user-1');
    expect(() => jwt.verify(token, 'test-secret')).not.toThrow();
  });

  it('stamps issued tokens with the "voyagin-backend" key id by default, matching the session token signing key configured in PowerSync Cloud', () => {
    const token = service.issue('user-1');
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded?.header.kid).toBe('voyagin-backend');
  });

  it('stamps issued tokens with a caller-provided key id, for environments that configure a different PowerSync signing key', () => {
    const withCustomKid = new PowerSyncTokenService('test-secret', instanceUrl, 'some-other-kid');
    const token = withCustomKid.issue('user-1');
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded?.header.kid).toBe('some-other-kid');
  });

  it('issues a token whose lifetime stays well within the 24h maximum PowerSync Cloud enforces between "iat" and "exp"', () => {
    const token = service.issue('user-1');
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    const lifetimeInSeconds = (decoded.exp as number) - (decoded.iat as number);

    expect(lifetimeInSeconds).toBeGreaterThan(0);
    expect(lifetimeInSeconds).toBeLessThanOrEqual(60 * 60);
  });

  it('honours a caller-provided expiry, for environments that need a different PowerSync token lifetime', () => {
    const withCustomExpiry = new PowerSyncTokenService('test-secret', instanceUrl, 'voyagin-backend', '5m');
    const token = withCustomExpiry.issue('user-1');
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    expect((decoded.exp as number) - (decoded.iat as number)).toBe(5 * 60);
  });
});
