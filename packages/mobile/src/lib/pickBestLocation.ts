import type { LatLng } from './coordinates';

// Combines multiple best-effort GPS sources by priority: the first non-null wins. Used to combine
// MediaLibrary asset info, direct EXIF-file-read, and the EXIF field returned by ImagePicker —
// each of which may fail independently depending on platform/OS version/vendor.
export function pickBestLocation(a: LatLng | null, b: LatLng | null): LatLng | null {
  return a ?? b;
}
