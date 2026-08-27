import request from 'supertest';
import jwt from 'jsonwebtoken';
import { buildTestApp, TEST_POWERSYNC_INSTANCE_URL } from '../testHelpers/testApp';

describe('POST /api/auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const app = buildTestApp();

    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alex@example.com', name: 'Alex', password: 'correct horse' });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ email: 'alex@example.com', name: 'Alex' });
    expect(response.body.user.hashedPassword).toBeUndefined();
  });

  it('rejects a weak password', async () => {
    const app = buildTestApp();

    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alex@example.com', name: 'Alex', password: 'short' });

    expect(response.status).toBe(400);
  });

  it('rejects registering the same email twice', async () => {
    const app = buildTestApp();
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'alex@example.com', name: 'Alex', password: 'correct horse' });

    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alex@example.com', name: 'Alex Again', password: 'correct horse' });

    expect(response.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('authenticates a registered user and returns a token', async () => {
    const app = buildTestApp();
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'alex@example.com', name: 'Alex', password: 'correct horse' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex@example.com', password: 'correct horse' });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ email: 'alex@example.com', name: 'Alex' });
  });

  it('rejects an unknown email', async () => {
    const app = buildTestApp();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'correct horse' });

    expect(response.status).toBe(401);
  });

  it('rejects a wrong password', async () => {
    const app = buildTestApp();
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'alex@example.com', name: 'Alex', password: 'correct horse' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex@example.com', password: 'wrong password' });

    expect(response.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('rejects using the token again after logout', async () => {
    const app = buildTestApp();
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alex@example.com', name: 'Alex', password: 'correct horse' });
    const token = registerResponse.body.token as string;

    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logoutResponse.status).toBe(204);

    const meResponse = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alexandre' });
    expect(meResponse.status).toBe(401);
  });

  it('rejects logging out without a token', async () => {
    const app = buildTestApp();
    const response = await request(app).post('/api/auth/logout');
    expect(response.status).toBe(401);
  });
});

describe('POST /api/auth/powersync-token', () => {
  it('rejects a request without a valid session token', async () => {
    const app = buildTestApp();

    const response = await request(app).post('/api/auth/powersync-token');

    expect(response.status).toBe(401);
  });

  it('issues a PowerSync-scoped token for the authenticated user, with the instance URL as audience', async () => {
    const app = buildTestApp();
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alex@example.com', name: 'Alex', password: 'correct horse' });
    const sessionToken = registerResponse.body.token as string;
    const userId = registerResponse.body.user.id as string;

    const response = await request(app)
      .post('/api/auth/powersync-token')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));

    const decoded = jwt.decode(response.body.token as string, { complete: true });
    expect(decoded?.payload).toMatchObject({ sub: userId, aud: TEST_POWERSYNC_INSTANCE_URL });
  });

  it('issues a PowerSync token whose lifetime stays well under the 7-day session token lifetime', async () => {
    const app = buildTestApp();
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alex@example.com', name: 'Alex', password: 'correct horse' });
    const sessionToken = registerResponse.body.token as string;

    const response = await request(app)
      .post('/api/auth/powersync-token')
      .set('Authorization', `Bearer ${sessionToken}`);

    const sessionPayload = jwt.decode(sessionToken) as jwt.JwtPayload;
    const powerSyncPayload = jwt.decode(response.body.token as string) as jwt.JwtPayload;
    const powerSyncLifetime = (powerSyncPayload.exp as number) - (powerSyncPayload.iat as number);
    const sessionLifetime = (sessionPayload.exp as number) - (sessionPayload.iat as number);

    expect(powerSyncLifetime).toBeLessThanOrEqual(60 * 60);
    expect(powerSyncLifetime).toBeLessThan(sessionLifetime);
  });
});
