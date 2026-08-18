import request from 'supertest';
import { InMemoryTripRepository } from '@voyagin/domain';
import { buildApp } from '../infrastructure/app';

describe('POST /api/trips', () => {
  it('creates a trip and returns it as 201', async () => {
    const tripRepository = new InMemoryTripRepository();
    const app = buildApp({ tripRepository });

    const response = await request(app)
      .post('/api/trips')
      .send({ name: 'Bali sabbatical', ownerId: 'user-1', ownerName: 'Alex' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'Bali sabbatical',
      participants: [{ userId: 'user-1', name: 'Alex', role: 'owner' }],
    });
    expect(response.body.id).toEqual(expect.any(String));
  });

  it('rejects a request missing the trip name with a 400', async () => {
    const tripRepository = new InMemoryTripRepository();
    const app = buildApp({ tripRepository });

    const response = await request(app)
      .post('/api/trips')
      .send({ ownerId: 'user-1', ownerName: 'Alex' });

    expect(response.status).toBe(400);
  });

  it('rejects an empty trip name with a 400', async () => {
    const tripRepository = new InMemoryTripRepository();
    const app = buildApp({ tripRepository });

    const response = await request(app)
      .post('/api/trips')
      .send({ name: '   ', ownerId: 'user-1', ownerName: 'Alex' });

    expect(response.status).toBe(400);
  });
});
