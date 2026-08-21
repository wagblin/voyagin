import request from 'supertest';
import { buildTestApp } from '../testHelpers/testApp';

describe('GET /api/health', () => {
  it('reports that the API is up', async () => {
    const app = buildTestApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });
});
