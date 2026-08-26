import { describe, expect, it, vi } from 'vitest'
import { createCapturedPhotoFile, isCameraCaptureSupported } from '../webcamCapture'

describe('isCameraCaptureSupported', () => {
  it('returns false when the browser exposes no mediaDevices API', () => {
    vi.stubGlobal('navigator', {})

    expect(isCameraCaptureSupported()).toBe(false)
  })

  it('returns false when mediaDevices exists but does not expose getUserMedia', () => {
    vi.stubGlobal('navigator', { mediaDevices: {} })

    expect(isCameraCaptureSupported()).toBe(false)
  })

  it('returns true when the browser supports getUserMedia', () => {
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } })

    expect(isCameraCaptureSupported()).toBe(true)
  })
})

describe('createCapturedPhotoFile', () => {
  it('wraps a captured video frame blob into a File the upload flow can use', () => {
    const blob = new Blob(['fake-bytes'], { type: 'image/jpeg' })

    const file = createCapturedPhotoFile(blob)

    expect(file).toBeInstanceOf(File)
    expect(file.type).toBe('image/jpeg')
  })

  it('defaults the file type to image/jpeg when the captured blob has no type', () => {
    const blob = new Blob(['fake-bytes'])

    const file = createCapturedPhotoFile(blob)

    expect(file.type).toBe('image/jpeg')
  })
})
