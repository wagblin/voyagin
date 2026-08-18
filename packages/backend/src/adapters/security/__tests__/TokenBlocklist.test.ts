import { TokenBlocklist } from '../TokenBlocklist';

describe('TokenBlocklist', () => {
  it('does not consider an untouched token revoked', () => {
    const blocklist = new TokenBlocklist();
    expect(blocklist.isRevoked('some-token')).toBe(false);
  });

  it('considers a token revoked once it has been revoked', () => {
    const blocklist = new TokenBlocklist();
    blocklist.revoke('some-token');
    expect(blocklist.isRevoked('some-token')).toBe(true);
  });
});
