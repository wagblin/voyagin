import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import {
  addParticipant,
  createTrip,
  deleteTrip,
  getTrip,
  listTrips,
  removeParticipant,
  updateTrip,
} from '../tripsApi'
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

  it('adds a participant by email', async () => {
    const updated = {
      ...sampleTrip,
      participants: [...sampleTrip.participants, { userId: 'user-2', name: 'Sam', role: 'member' as const }],
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve(updated) }),
    )

    expect(await addParticipant('trip-1', 'sam@example.com')).toEqual(updated)
  })

  it('rejects adding a participant with no matching account', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'No account found for this email.' }),
      }),
    )

    await expect(addParticipant('trip-1', 'unknown@example.com')).rejects.toThrow(
      'No account found for this email.',
    )
  })

  it('removes a participant', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(sampleTrip) }),
    )

    expect(await removeParticipant('trip-1', 'user-2')).toEqual(sampleTrip)
  })

  it('rejects removing the owner', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: 'Cannot remove the owner from this trip.' }),
      }),
    )

    await expect(removeParticipant('trip-1', 'user-1')).rejects.toThrow(
      'Cannot remove the owner',
    )
  })
})
