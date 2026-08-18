import express from 'express';
import request from 'supertest';
import { JwtTokenService } from '../../security/JwtTokenService';
import { TokenBlocklist } from '../../security/TokenBlocklist';
import { requireAuth } from '../requireAuth';

function buildTestApp(tokenService: JwtTokenService, blocklist: TokenBlocklist) {
  const app = express();
  app.get('/protected', requireAuth(tokenService, blocklist), (req, res) => {
    res.status(200).json({ userId: req.userId });
  });
  return app;
}

describe('requireAuth', () => {
  const tokenService = new JwtTokenService('test-secret');
  let blocklist: TokenBlocklist;
  let app: express.Express;

  beforeEach(() => {
    blocklist = new TokenBlocklist();
    app = buildTestApp(tokenService, blocklist);
  });

  it('rejects a request without an Authorization header', async () => {
    const response = await request(app).get('/protected');
    expect(response.status).toBe(401);
  });

  it('rejects a malformed Authorization header', async () => {
    const response = await request(app).get('/protected').set('Authorization', 'not-bearer');
    expect(response.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token');
    expect(response.status).toBe(401);
  });

  it('rejects a revoked token', async () => {
    const token = tokenService.issue('user-1');
    blocklist.revoke(token);

    const response = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
  });

  it('attaches the authenticated user id and calls next for a valid token', async () => {
    const token = tokenService.issue('user-1');

    const response = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: 'user-1' });
  });
});
