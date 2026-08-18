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

async function registerAndGetToken(app: ReturnType<typeof buildTestApp>) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ email: 'alex@example.com', name: 'Alex', password: 'correct horse' });
  return response.body.token as string;
}

describe('PATCH /api/users/me', () => {
  it('updates the authenticated user name', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);

    const response = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alexandre' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Alexandre');
  });

  it('rejects an unauthenticated request', async () => {
    const app = buildTestApp();

    const response = await request(app).patch('/api/users/me').send({ name: 'Alexandre' });

    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/users/me', () => {
  it('deletes the authenticated user account', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);

    const deleteResponse = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(204);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex@example.com', password: 'correct horse' });
    expect(loginResponse.status).toBe(401);
  });

  it('rejects an unauthenticated request', async () => {
    const app = buildTestApp();

    const response = await request(app).delete('/api/users/me');

    expect(response.status).toBe(401);
  });
});
