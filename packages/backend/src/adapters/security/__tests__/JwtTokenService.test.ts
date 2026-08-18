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
});
