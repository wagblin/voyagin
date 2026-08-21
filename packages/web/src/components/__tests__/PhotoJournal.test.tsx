import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PhotoJournal } from '../PhotoJournal'

vi.mock('../TripMap', () => ({
  TripMap: () => null,
}))

function renderPhotoJournal() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <PhotoJournal tripId="trip-1" currentUserId="user-1" canDeleteAnyPhoto={false} />
    </QueryClientProvider>,
  )
}

describe('PhotoJournal', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lets the user pick a photo from their library instead of forcing the camera to open', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }))

    renderPhotoJournal()

    const fileInput = await screen.findByLabelText('Photo')
    expect(fileInput).not.toHaveAttribute('capture')
  })
})
