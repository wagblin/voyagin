import { describe, expect, it, vi, afterEach } from 'vitest'
import { apiFetch } from '../apiClient'

describe('apiFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sets a JSON content-type by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/api/whatever', { method: 'POST', body: JSON.stringify({}) })

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('does not set a JSON content-type when sending FormData, so the browser can set the multipart boundary', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/api/whatever', { method: 'POST', body: new FormData() })

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers['Content-Type']).toBeUndefined()
  })
})
