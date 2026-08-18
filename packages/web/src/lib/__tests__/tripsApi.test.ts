import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { createTrip, deleteTrip, getTrip, listTrips, updateTrip } from '../tripsApi'
import { storeAuth } from '../authStorage'

const sampleTrip = {
  id: 'trip-1',
  name: 'Bali sabbatical',
  dateRange: null,
  participants: [{ userId: 'user-1', name: 'Alex', role: 'owner' as const }],
}

describe('tripsApi', () => {
  beforeEach(() => {
    storeAuth('token-123', { id: 'user-1', email: 'alex@example.com', name: 'Alex' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lists trips', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([sampleTrip]) }),
    )

    expect(await listTrips()).toEqual([sampleTrip])
  })

  it('gets a trip by id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(sampleTrip) }),
    )

    expect(await getTrip('trip-1')).toEqual(sampleTrip)
  })

  it('creates a trip', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve(sampleTrip) }),
    )

    expect(await createTrip({ name: 'Bali sabbatical' })).toEqual(sampleTrip)
  })

  it('updates a trip', async () => {
    const updated = { ...sampleTrip, name: 'Bali trip, take two' }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(updated) }),
    )

    expect(await updateTrip('trip-1', { name: 'Bali trip, take two' })).toEqual(updated)
  })

  it('rejects updating a trip you do not own', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'user-2 is not the owner of this trip and cannot modify it.' }),
      }),
    )

    await expect(updateTrip('trip-1', { name: 'Hijacked' })).rejects.toThrow(
      'is not the owner of this trip',
    )
  })

  it('deletes a trip', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve({}) }))

    await expect(deleteTrip('trip-1')).resolves.toBeUndefined()
  })
})
