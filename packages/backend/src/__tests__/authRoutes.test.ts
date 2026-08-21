import request from 'supertest';
import { buildTestApp } from '../testHelpers/testApp';

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
