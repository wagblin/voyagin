import jwt from 'jsonwebtoken';
import { JwtTokenService } from '../JwtTokenService';

describe('JwtTokenService', () => {
  const service = new JwtTokenService('test-secret');

  it('issues a token that verifies back to the same user id', () => {
    const token = service.issue('user-1');
    expect(service.verify(token)).toEqual({ userId: 'user-1' });
  });

  it('rejects a malformed token', () => {
    expect(service.verify('not-a-jwt')).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const other = new JwtTokenService('other-secret');
    const token = other.issue('user-1');
    expect(service.verify(token)).toBeNull();
  });

  it('stamps issued tokens with the "voyagin-backend" key id by default, so PowerSync Cloud can match them against its configured signing key', () => {
    const token = service.issue('user-1');
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded?.header.kid).toBe('voyagin-backend');
  });

  it('stamps issued tokens with a caller-provided key id, for environments that configure a different PowerSync signing key', () => {
    const withCustomKid = new JwtTokenService('test-secret', '7d', 'some-other-kid');
    const token = withCustomKid.issue('user-1');
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded?.header.kid).toBe('some-other-kid');
  });
});
