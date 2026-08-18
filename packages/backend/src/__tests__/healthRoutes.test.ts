import request from 'supertest';
import { InMemoryTripRepository, InMemoryUserRepository, InMemoryPasswordHasher } from '@voyagin/domain';
import { buildApp } from '../infrastructure/app';
import { JwtTokenService } from '../adapters/security/JwtTokenService';
import { TokenBlocklist } from '../adapters/security/TokenBlocklist';

describe('GET /api/health', () => {
  it('reports that the API is up', async () => {
    const app = buildApp({
      tripRepository: new InMemoryTripRepository(),
      userRepository: new InMemoryUserRepository(),
      passwordHasher: new InMemoryPasswordHasher(),
      tokenService: new JwtTokenService('test-secret'),
      tokenBlocklist: new TokenBlocklist(),
    });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });
});
