import { parseExifCoordinates } from '../exifLocation';

describe('parseExifCoordinates', () => {
  it('returns null when exif is null or undefined', () => {
    expect(parseExifCoordinates(null)).toBeNull();
    expect(parseExifCoordinates(undefined)).toBeNull();
  });

  it('returns null when GPS tags are absent (photo with no location metadata)', () => {
    expect(parseExifCoordinates({ Orientation: 1, Make: 'Apple' })).toBeNull();
  });

  it('returns coordinates already signed as-is', () => {
    expect(parseExifCoordinates({ GPSLatitude: -48.8566, GPSLongitude: -2.3522 })).toEqual({
      latitude: -48.8566,
      longitude: -2.3522,
    });
  });

  it('applies the sign from GPSLatitudeRef/GPSLongitudeRef when values are absolute', () => {
    expect(
      parseExifCoordinates({
        GPSLatitude: 48.8566,
        GPSLatitudeRef: 'S',
        GPSLongitude: 2.3522,
        GPSLongitudeRef: 'W',
      }),
    ).toEqual({ latitude: -48.8566, longitude: -2.3522 });
  });

  it('keeps positive values when Ref is N/E', () => {
    expect(
      parseExifCoordinates({
        GPSLatitude: 48.8566,
        GPSLatitudeRef: 'N',
        GPSLongitude: 2.3522,
        GPSLongitudeRef: 'E',
      }),
    ).toEqual({ latitude: 48.8566, longitude: 2.3522 });
  });

  it('keeps an already-negative value even when Ref would suggest otherwise', () => {
    expect(
      parseExifCoordinates({ GPSLatitude: -48.8566, GPSLatitudeRef: 'N', GPSLongitude: 2.3522, GPSLongitudeRef: 'E' }),
    ).toEqual({ latitude: -48.8566, longitude: 2.3522 });
  });

  it('parses stringified numeric values', () => {
    expect(parseExifCoordinates({ GPSLatitude: '48.8566', GPSLongitude: '2.3522' })).toEqual({
      latitude: 48.8566,
      longitude: 2.3522,
    });
  });

  it('returns null when GPSLatitude is present but GPSLongitude is missing', () => {
    expect(parseExifCoordinates({ GPSLatitude: 48.8566 })).toBeNull();
  });

  it('returns null when a GPS value is not a usable number', () => {
    expect(parseExifCoordinates({ GPSLatitude: 'unknown', GPSLongitude: 2.3522 })).toBeNull();
  });
});
