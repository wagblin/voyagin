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

function stubGeolocationSuccess(latitude: number, longitude: number) {
  const getCurrentPosition = vi.fn((success: PositionCallback) => {
    success({ coords: { latitude, longitude } } as GeolocationPosition)
  })
  vi.stubGlobal('navigator', {
    ...navigator,
    geolocation: { getCurrentPosition },
  })
  return getCurrentPosition
}

function stubGeolocationError(code: number) {
  const getCurrentPosition = vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
    error({ code, message: 'irrelevant native message' } as GeolocationPositionError)
  })
  vi.stubGlobal('navigator', {
    ...navigator,
    geolocation: { getCurrentPosition },
  })
  return getCurrentPosition
}

async function renderWithFileSelected() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }))
  vi.mocked(gps).mockResolvedValue(undefined)
  vi.mocked(parse).mockResolvedValue({})

  renderPhotoJournal()

  const fileInput = await screen.findByLabelText('Photo')
  fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

  return screen.findByRole('button', { name: 'Ma position' })
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

    const fileInput = await screen.findByLabelText('Photo')
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

    const latitudeInput = await screen.findByLabelText('Latitude')
    const longitudeInput = await screen.findByLabelText('Longitude')
    fireEvent.change(latitudeInput, { target: { value: '10' } })
    fireEvent.change(longitudeInput, { target: { value: '20' } })

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
    vi.mocked(parse).mockResolvedValue({})

    renderPhotoJournal()

    const fileInput = await screen.findByLabelText('Photo')
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

    await waitFor(() => {
      expect(parse).toHaveBeenCalled()
    })

    const latitudeInput = screen.getByLabelText('Latitude')
    fireEvent.change(latitudeInput, { target: { value: '48.8566' } })

    const submitButton = screen.getByRole('button', { name: 'Ajouter la photo' })
    expect(submitButton).toBeDisabled()
  })

  it('has a "Date de prise" field rendered as a datetime-local input', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }))

    renderPhotoJournal()

    const fileInput = await screen.findByLabelText('Photo')
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

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

    const fileInput = await screen.findByLabelText('Photo')
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

    const dateTakenInput = await screen.findByLabelText('Date de prise')
    fireEvent.change(dateTakenInput, { target: { value: '2020-01-01T00:00' } })

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

  it('falls back to the live browser position and the current date when the selected file has no EXIF GPS/date metadata (e.g. a fresh camera capture on iOS Safari)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }))
    vi.mocked(gps).mockResolvedValue(undefined)
    vi.mocked(parse).mockResolvedValue({})
    const getCurrentPosition = stubGeolocationSuccess(48.8566, 2.3522)

    renderPhotoJournal()

    const fileInput = await screen.findByLabelText('Photo')
    // Real user flow: clicking/tapping the file input (a direct user gesture) happens before
    // the native camera/picker UI opens and the file eventually comes back via `change`.
    // The geolocation request is kicked off on that click, in parallel with the picker.
    fireEvent.click(fileInput)
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

    await waitFor(() => {
      expect(screen.getByLabelText('Latitude')).toHaveValue('48.8566')
      expect(screen.getByLabelText('Longitude')).toHaveValue('2.3522')
      expect((screen.getByLabelText('Date de prise') as HTMLInputElement).value).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      )
    })

    // Exactly one call: the position must come from the promise kicked off on the click
    // (pendingPositionRef), not from a fresh call made from inside handleFileChange — a
    // regression that would request geolocation a second time instead of awaiting the
    // pre-fetched one.
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
  })

  it('shows a permission-specific message when geolocation is refused by the user', async () => {
    const useMyLocationButton = await renderWithFileSelected()
    stubGeolocationError(1)

    fireEvent.click(useMyLocationButton)

    await screen.findByText('Localisation refusée — vérifie les autorisations de site dans ton navigateur.')
  })

  it('shows an unavailable-position message when the device cannot determine its position', async () => {
    const useMyLocationButton = await renderWithFileSelected()
    stubGeolocationError(2)

    fireEvent.click(useMyLocationButton)

    await screen.findByText('Position indisponible pour le moment.')
  })

  it('shows a timeout message when the geolocation request takes too long', async () => {
    const useMyLocationButton = await renderWithFileSelected()
    stubGeolocationError(3)

    fireEvent.click(useMyLocationButton)

    await screen.findByText('La récupération de la position a pris trop de temps.')
  })

  it('does not fall back to the live browser position when the selected file has EXIF GPS metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }))
    vi.mocked(gps).mockResolvedValue({ latitude: 48.8566, longitude: 2.3522 })
    vi.mocked(parse).mockResolvedValue({ DateTimeOriginal: new Date('2024-03-15T14:23:00') })
    const getCurrentPosition = stubGeolocationSuccess(0, 0)

    renderPhotoJournal()

    const fileInput = await screen.findByLabelText('Photo')
    fireEvent.change(fileInput, { target: { files: [samplePhotoFile()] } })

    await waitFor(() => {
      expect(screen.getByLabelText('Latitude')).toHaveValue('48.8566')
      expect(screen.getByLabelText('Longitude')).toHaveValue('2.3522')
    })

    expect(getCurrentPosition).not.toHaveBeenCalled()
  })
})
