export function isCameraCaptureSupported(): boolean {
  return typeof navigator.mediaDevices?.getUserMedia === 'function'
}

export function createCapturedPhotoFile(blob: Blob): File {
  return new File([blob], `webcam-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' })
}
