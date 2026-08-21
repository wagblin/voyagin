import { describe, expect, it, vi } from 'vitest'
import { gps, parse } from 'exifr'
import { extractDateTakenFromFile, extractGpsFromFile } from '../exifLocation'

vi.mock('exifr', () => ({ gps: vi.fn(), parse: vi.fn() }))

describe('extractGpsFromFile', () => {
  it('returns the coordinates found in the file EXIF metadata', async () => {
    vi.mocked(gps).mockResolvedValue({ latitude: 48.8566, longitude: 2.3522 })
    const file = new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' })

    await expect(extractGpsFromFile(file)).resolves.toEqual({ latitude: 48.8566, longitude: 2.3522 })
  })

  it('returns null when the file has no GPS metadata', async () => {
    vi.mocked(gps).mockResolvedValue(undefined)
    const file = new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' })

    await expect(extractGpsFromFile(file)).resolves.toBeNull()
  })

  it('returns null instead of throwing when EXIF parsing fails', async () => {
    vi.mocked(gps).mockRejectedValue(new Error('unsupported format'))
    const file = new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' })

    await expect(extractGpsFromFile(file)).resolves.toBeNull()
  })
})

describe('extractDateTakenFromFile', () => {
  it('returns the date the photo was taken, formatted for a datetime-local input', async () => {
    vi.mocked(parse).mockResolvedValue({ DateTimeOriginal: new Date('2024-03-15T14:23:00') })
    const file = new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' })

    await expect(extractDateTakenFromFile(file)).resolves.toBe('2024-03-15T14:23')
  })

  it('returns null when the file has no DateTimeOriginal metadata', async () => {
    vi.mocked(parse).mockResolvedValue({})
    const file = new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' })

    await expect(extractDateTakenFromFile(file)).resolves.toBeNull()
  })

  it('returns null instead of throwing when EXIF parsing fails', async () => {
    vi.mocked(parse).mockRejectedValue(new Error('unsupported format'))
    const file = new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' })

    await expect(extractDateTakenFromFile(file)).resolves.toBeNull()
  })
})
