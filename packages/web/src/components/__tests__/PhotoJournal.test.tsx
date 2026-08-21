import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { gps, parse } from 'exifr'
import { PhotoJournal } from '../PhotoJournal'

vi.mock('../TripMap', () => ({
  TripMap: () => null,
}))

vi.mock('exifr', () => ({ gps: vi.fn(), parse: vi.fn() }))

function renderPhotoJournal() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <PhotoJournal tripId="trip-1" currentUserId="user-1" canDeleteAnyPhoto={false} />
    </QueryClientProvider>,
  )
}

function samplePhotoFile() {
  return new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' })
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

  it('pre-fills latitude and longitude from the selected file EXIF GPS metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }))
    vi.mocked(gps).mockResolvedValue({ latitude: 48.8566, longitude: 2.3522 })

    renderPhotoJournal()

    const fileInput = await screen.findByLabelText('Photo')
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

    await waitFor(() => {
      expect(screen.getByLabelText('Latitude')).toHaveValue('48.8566')
      expect(screen.getByLabelText('Longitude')).toHaveValue('2.3522')
    })
  })

  it('does not overwrite coordinates already entered manually when a new file with EXIF GPS is selected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }))
    vi.mocked(gps).mockResolvedValue({ latitude: 48.8566, longitude: 2.3522 })

    renderPhotoJournal()

    const latitudeInput = await screen.findByLabelText('Latitude')
    const longitudeInput = await screen.findByLabelText('Longitude')
    fireEvent.change(latitudeInput, { target: { value: '10' } })
    fireEvent.change(longitudeInput, { target: { value: '20' } })

    const fileInput = screen.getByLabelText('Photo')
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

    await waitFor(() => {
      expect(gps).toHaveBeenCalled()
    })

    expect(latitudeInput).toHaveValue('10')
    expect(longitudeInput).toHaveValue('20')
  })

  it('submits successfully with a file but without latitude/longitude filled in', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) })
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(gps).mockResolvedValue(undefined)

    renderPhotoJournal()

    const fileInput = await screen.findByLabelText('Photo')
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

    const submitButton = await screen.findByRole('button', { name: 'Ajouter la photo' })
    expect(submitButton).not.toBeDisabled()

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/trips/trip-1/photos'),
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  it('disables the submit button when only one of latitude/longitude is filled in manually', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }))
    vi.mocked(gps).mockResolvedValue(undefined)

    renderPhotoJournal()

    const fileInput = await screen.findByLabelText('Photo')
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

    const latitudeInput = screen.getByLabelText('Latitude')
    fireEvent.change(latitudeInput, { target: { value: '48.8566' } })

    const submitButton = screen.getByRole('button', { name: 'Ajouter la photo' })
    expect(submitButton).toBeDisabled()
  })

  it('has a "Date de prise" field rendered as a datetime-local input', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }))

    renderPhotoJournal()

    const dateTakenInput = await screen.findByLabelText('Date de prise')
    expect(dateTakenInput).toHaveAttribute('type', 'datetime-local')
  })

  it('pre-fills the "Date de prise" field from the selected file EXIF date metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }))
    vi.mocked(gps).mockResolvedValue(undefined)
    vi.mocked(parse).mockResolvedValue({ DateTimeOriginal: new Date('2024-03-15T14:23:00') })

    renderPhotoJournal()

    const fileInput = await screen.findByLabelText('Photo')
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

    await waitFor(() => {
      expect(screen.getByLabelText('Date de prise')).toHaveValue('2024-03-15T14:23')
    })
  })

  it('does not overwrite a "Date de prise" already entered manually when a new file with an EXIF date is selected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }))
    vi.mocked(gps).mockResolvedValue(undefined)
    vi.mocked(parse).mockResolvedValue({ DateTimeOriginal: new Date('2024-03-15T14:23:00') })

    renderPhotoJournal()

    const dateTakenInput = await screen.findByLabelText('Date de prise')
    fireEvent.change(dateTakenInput, { target: { value: '2020-01-01T00:00' } })

    const fileInput = screen.getByLabelText('Photo')
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

    await waitFor(() => {
      expect(parse).toHaveBeenCalled()
    })

    expect(dateTakenInput).toHaveValue('2020-01-01T00:00')
  })

  it('submits successfully when "Date de prise" is left empty, defaulting to now', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) })
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(gps).mockResolvedValue(undefined)
    vi.mocked(parse).mockResolvedValue({})

    renderPhotoJournal()

    const fileInput = await screen.findByLabelText('Photo')
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

    const dateTakenInput = screen.getByLabelText('Date de prise')
    expect(dateTakenInput).toHaveValue('')

    const submitButton = await screen.findByRole('button', { name: 'Ajouter la photo' })
    expect(submitButton).not.toBeDisabled()

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/trips/trip-1/photos'),
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })
})
