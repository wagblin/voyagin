import request from 'supertest';
import { InMemoryTripRepository } from '@voyagin/domain';
import { buildApp } from '../infrastructure/app';

describe('GET /api/health', () => {
  it('reports that the API is up', async () => {
    const app = buildApp({ tripRepository: new InMemoryTripRepository() });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });
});
