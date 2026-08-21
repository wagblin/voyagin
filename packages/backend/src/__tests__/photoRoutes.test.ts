import request from 'supertest';
import { buildTestApp } from '../testHelpers/testApp';

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

async function createTrip(app: ReturnType<typeof buildTestApp>, token: string) {
  const response = await request(app)
    .post('/api/trips')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Bali sabbatical' });
  return response.body.id as string;
}

describe('POST /api/trips/:id/photos', () => {
  it('adds a geolocated photo to a trip the user participates in', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);
    const tripId = await createTrip(app, token);

    const response = await request(app)
      .post(`/api/trips/${tripId}/photos`)
      .set('Authorization', `Bearer ${token}`)
      .field('latitude', '48.8566')
      .field('longitude', '2.3522')
      .field('takenAt', '2026-09-01T10:00:00.000Z')
      .field('caption', 'Eiffel Tower')
      .attach('image', Buffer.from('fake-image-bytes'), 'photo.jpg');

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      tripId,
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/fake.jpg',
      location: { latitude: 48.8566, longitude: 2.3522 },
      caption: 'Eiffel Tower',
    });
  });

  it('rejects an unauthenticated request', async () => {
    const app = buildTestApp();
    const response = await request(app)
      .post('/api/trips/some-id/photos')
      .field('latitude', '48.8566')
      .field('longitude', '2.3522')
      .attach('image', Buffer.from('fake-image-bytes'), 'photo.jpg');

    expect(response.status).toBe(401);
  });

  it('rejects a request missing the image file with a 400', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);
    const tripId = await createTrip(app, token);

    const response = await request(app)
      .post(`/api/trips/${tripId}/photos`)
      .set('Authorization', `Bearer ${token}`)
      .field('latitude', '48.8566')
      .field('longitude', '2.3522');

    expect(response.status).toBe(400);
  });

  it('rejects an out-of-range latitude with a 400', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);
    const tripId = await createTrip(app, token);

    const response = await request(app)
      .post(`/api/trips/${tripId}/photos`)
      .set('Authorization', `Bearer ${token}`)
      .field('latitude', '200')
      .field('longitude', '2.3522')
      .attach('image', Buffer.from('fake-image-bytes'), 'photo.jpg');

    expect(response.status).toBe(400);
  });

  it('rejects a user who is not a participant of the trip with a 403', async () => {
    const app = buildTestApp();
    const ownerToken = await registerAndGetToken(app, 'alice@example.com', 'Alice');
    const strangerToken = await registerAndGetToken(app, 'bob@example.com', 'Bob');
    const tripId = await createTrip(app, ownerToken);

    const response = await request(app)
      .post(`/api/trips/${tripId}/photos`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .field('latitude', '48.8566')
      .field('longitude', '2.3522')
      .attach('image', Buffer.from('fake-image-bytes'), 'photo.jpg');

    expect(response.status).toBe(403);
  });
});

describe('GET /api/trips/:id/photos', () => {
  it("lists a trip's photos for a participant", async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);
    const tripId = await createTrip(app, token);
    await request(app)
      .post(`/api/trips/${tripId}/photos`)
      .set('Authorization', `Bearer ${token}`)
      .field('latitude', '48.8566')
      .field('longitude', '2.3522')
      .attach('image', Buffer.from('fake-image-bytes'), 'photo.jpg');

    const response = await request(app)
      .get(`/api/trips/${tripId}/photos`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it('returns 403 for a non-participant', async () => {
    const app = buildTestApp();
    const ownerToken = await registerAndGetToken(app, 'alice@example.com', 'Alice');
    const strangerToken = await registerAndGetToken(app, 'bob@example.com', 'Bob');
    const tripId = await createTrip(app, ownerToken);

    const response = await request(app)
      .get(`/api/trips/${tripId}/photos`)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/photos/:id', () => {
  it('lets the uploader delete their own photo', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);
    const tripId = await createTrip(app, token);
    const addResponse = await request(app)
      .post(`/api/trips/${tripId}/photos`)
      .set('Authorization', `Bearer ${token}`)
      .field('latitude', '48.8566')
      .field('longitude', '2.3522')
      .attach('image', Buffer.from('fake-image-bytes'), 'photo.jpg');

    const response = await request(app)
      .delete(`/api/photos/${String(addResponse.body.id)}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('rejects a delete from someone who is neither the uploader nor the trip owner', async () => {
    const app = buildTestApp();
    const ownerToken = await registerAndGetToken(app, 'alice@example.com', 'Alice');
    const strangerToken = await registerAndGetToken(app, 'bob@example.com', 'Bob');
    const tripId = await createTrip(app, ownerToken);
    const addResponse = await request(app)
      .post(`/api/trips/${tripId}/photos`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('latitude', '48.8566')
      .field('longitude', '2.3522')
      .attach('image', Buffer.from('fake-image-bytes'), 'photo.jpg');

    const response = await request(app)
      .delete(`/api/photos/${String(addResponse.body.id)}`)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(response.status).toBe(403);
  });

  it('returns 404 for an unknown photo', async () => {
    const app = buildTestApp();
    const token = await registerAndGetToken(app);

    const response = await request(app)
      .delete('/api/photos/unknown-id')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
