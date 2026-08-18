import request from 'supertest';
import { InMemoryTripRepository, InMemoryUserRepository, InMemoryPasswordHasher } from '@voyagin/domain';
import { buildApp } from '../infrastructure/app';
import { JwtTokenService } from '../adapters/security/JwtTokenService';
import { TokenBlocklist } from '../adapters/security/TokenBlocklist';

function buildTestApp() {
  return buildApp({
    tripRepository: new InMemoryTripRepository(),
    userRepository: new InMemoryUserRepository(),
    passwordHasher: new InMemoryPasswordHasher(),
    tokenService: new JwtTokenService('test-secret'),
    tokenBlocklist: new TokenBlocklist(),
  });
}

async function registerAndGetToken(
  app: ReturnType<typeof buildTestApp>,
  email = 'alex@example.com',
  name = 'Alex',
) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ email, name, password: 'correct horse' });
  return response.body.token as string;
}

describe('POST /api/trips', () => {
  it('creates a trip owned by the authenticated user', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);

    const response = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bali sabbatical' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'Bali sabbatical',
      participants: [{ userId: expect.any(String), name: 'Alex', role: 'owner' }],
    });
    expect(response.body.id).toEqual(expect.any(String));
  });

  it('rejects an unauthenticated request', async () => {
    const app = buildTestApp();

    const response = await request(app).post('/api/trips').send({ name: 'Bali sabbatical' });

    expect(response.status).toBe(401);
  });

  it('rejects an empty trip name with a 400', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);

    const response = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '   ' });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/trips', () => {
  it("lists only the authenticated user's trips", async () => {
    const app = buildTestApp();
    const aliceToken = await registerAndGetToken(app, 'alice@example.com', 'Alice');
    const bobToken = await registerAndGetToken(app, 'bob@example.com', 'Bob');

    await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: "Alice's trip" });
    await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ name: "Bob's trip" });

    const response = await request(app).get('/api/trips').set('Authorization', `Bearer ${aliceToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ name: "Alice's trip" });
  });
});

describe('GET /api/trips/:id', () => {
  it('returns a trip the authenticated user participates in', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);
    const createResponse = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bali sabbatical' });

    const response = await request(app)
      .get(`/api/trips/${String(createResponse.body.id)}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'Bali sabbatical' });
  });

  it('returns 404 for a trip the authenticated user does not participate in', async () => {
    const app = buildTestApp();
    const ownerToken = await registerAndGetToken(app, 'alice@example.com', 'Alice');
    const strangerToken = await registerAndGetToken(app, 'bob@example.com', 'Bob');
    const createResponse = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: "Alice's trip" });

    const response = await request(app)
      .get(`/api/trips/${String(createResponse.body.id)}`)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/trips/:id', () => {
  it('renames a trip owned by the authenticated user', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);
    const createResponse = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bali sabbatical' });

    const response = await request(app)
      .patch(`/api/trips/${String(createResponse.body.id)}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bali trip, take two' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Bali trip, take two');
  });

  it('rejects an update from a non-owner with a 403', async () => {
    const app = buildTestApp();
    const ownerToken = await registerAndGetToken(app, 'alice@example.com', 'Alice');
    const strangerToken = await registerAndGetToken(app, 'bob@example.com', 'Bob');
    const createResponse = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: "Alice's trip" });

    const response = await request(app)
      .patch(`/api/trips/${String(createResponse.body.id)}`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({ name: 'Hijacked' });

    expect(response.status).toBe(403);
  });

  it('returns 404 for an unknown trip', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);

    const response = await request(app)
      .patch('/api/trips/unknown-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Anything' });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/trips/:id', () => {
  it('deletes a trip owned by the authenticated user', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);
    const createResponse = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bali sabbatical' });

    const deleteResponse = await request(app)
      .delete(`/api/trips/${String(createResponse.body.id)}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app)
      .get(`/api/trips/${String(createResponse.body.id)}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getResponse.status).toBe(404);
  });

  it('rejects a delete from a non-owner with a 403', async () => {
    const app = buildTestApp();
    const ownerToken = await registerAndGetToken(app, 'alice@example.com', 'Alice');
    const strangerToken = await registerAndGetToken(app, 'bob@example.com', 'Bob');
    const createResponse = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: "Alice's trip" });

    const response = await request(app)
      .delete(`/api/trips/${String(createResponse.body.id)}`)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(response.status).toBe(403);
  });
});
