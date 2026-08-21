import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { addPhoto, deletePhoto, listTripPhotos } from '../photosApi'
import { storeAuth } from '../authStorage'

const samplePhoto = {
  id: 'photo-1',
  tripId: 'trip-1',
  uploaderId: 'user-1',
  imageUrl: 'https://res.cloudinary.com/demo/image/upload/photo.jpg',
  location: { latitude: 48.8566, longitude: 2.3522 },
  takenAt: '2026-09-01T10:00:00.000Z',
  caption: 'Eiffel Tower',
}

describe('photosApi', () => {
  beforeEach(() => {
    storeAuth('token-123', { id: 'user-1', email: 'alex@example.com', name: 'Alex' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lists a trip photos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([samplePhoto]) }),
    )

    expect(await listTripPhotos('trip-1')).toEqual([samplePhoto])
  })

  it('uploads a photo as multipart form data', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve(samplePhoto) })
    vi.stubGlobal('fetch', fetchMock)
    const file = new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' })

    const result = await addPhoto('trip-1', {
      file,
      latitude: 48.8566,
      longitude: 2.3522,
      caption: 'Eiffel Tower',
    })

    expect(result).toEqual(samplePhoto)
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/trips/trip-1/photos')
    expect(options.body).toBeInstanceOf(FormData)
    const body = options.body as FormData
    expect(body.get('image')).toBe(file)
    expect(body.get('latitude')).toBe('48.8566')
    expect(body.get('caption')).toBe('Eiffel Tower')
  })

  it('rejects the upload when the API returns an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'You are not a participant of this trip.' }),
      }),
    )
    const file = new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' })

    await expect(
      addPhoto('trip-1', { file, latitude: 48.8566, longitude: 2.3522 }),
    ).rejects.toThrow('not a participant')
  })

  it('deletes a photo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve({}) }),
    )

    await expect(deletePhoto('photo-1')).resolves.toBeUndefined()
  })
})
