export interface ExifCoordinates {
  latitude: number;
  longitude: number;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// EXIF sometimes reports GPS coordinates already signed (negative for South/West), and sometimes
// as an absolute value paired with a separate Ref ('N'/'S'/'E'/'W') that carries the sign — this
// varies by platform. A negative value is trusted as already-signed; a non-negative value is
// negated when its Ref says South or West.
function applyHemisphereSign(value: number, ref: unknown): number {
  if (value < 0) {
    return value;
  }
  return ref === 'S' || ref === 'W' ? -value : value;
}

// Best-effort extraction of GPS coordinates from an image's EXIF metadata (as returned by
// `ImagePicker.launchImageLibraryAsync({ exif: true })`). Many photos have no GPS metadata at
// all — that's expected, not an error — so this returns `null` instead of throwing whenever the
// standard GPSLatitude/GPSLongitude tags aren't present or aren't usable.
export function parseExifCoordinates(exif: Record<string, unknown> | null | undefined): ExifCoordinates | null {
  if (exif === null || exif === undefined) {
    return null;
  }

  const rawLatitude = toNumber(exif.GPSLatitude);
  const rawLongitude = toNumber(exif.GPSLongitude);
  if (rawLatitude === null || rawLongitude === null) {
    return null;
  }

  return {
    latitude: applyHemisphereSign(rawLatitude, exif.GPSLatitudeRef),
    longitude: applyHemisphereSign(rawLongitude, exif.GPSLongitudeRef),
  };
}
