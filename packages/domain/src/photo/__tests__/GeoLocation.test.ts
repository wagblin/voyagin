import { GeoLocation } from '../GeoLocation';
import { IncompleteGeoLocationError, InvalidGeoLocationError } from '../errors';

describe('GeoLocation', () => {
  it('creates a location from a valid latitude and longitude', () => {
    const location = GeoLocation.create(48.8566, 2.3522);
    expect(location.latitude).toBe(48.8566);
    expect(location.longitude).toBe(2.3522);
  });

  it('accepts the north pole latitude boundary (90)', () => {
    const location = GeoLocation.create(90, 0);
    expect(location.latitude).toBe(90);
  });

  it('accepts the south pole latitude boundary (-90)', () => {
    const location = GeoLocation.create(-90, 0);
    expect(location.latitude).toBe(-90);
  });

  it('accepts the antimeridian longitude boundary (180)', () => {
    const location = GeoLocation.create(0, 180);
    expect(location.longitude).toBe(180);
  });

  it('accepts the antimeridian longitude boundary (-180)', () => {
    const location = GeoLocation.create(0, -180);
    expect(location.longitude).toBe(-180);
  });

  it('rejects a latitude above 90', () => {
    expect(() => GeoLocation.create(90.0001, 0)).toThrow(InvalidGeoLocationError);
  });

  it('rejects a latitude below -90', () => {
    expect(() => GeoLocation.create(-90.0001, 0)).toThrow(InvalidGeoLocationError);
  });

  it('rejects a longitude above 180', () => {
    expect(() => GeoLocation.create(0, 180.0001)).toThrow(InvalidGeoLocationError);
  });

  it('rejects a longitude below -180', () => {
    expect(() => GeoLocation.create(0, -180.0001)).toThrow(InvalidGeoLocationError);
  });

  describe('createOptional', () => {
    it('returns undefined when neither latitude nor longitude is provided', () => {
      expect(GeoLocation.createOptional(undefined, undefined)).toBeUndefined();
    });

    it('creates a location when both latitude and longitude are provided', () => {
      const location = GeoLocation.createOptional(48.8566, 2.3522);
      expect(location?.latitude).toBe(48.8566);
      expect(location?.longitude).toBe(2.3522);
    });

    it('rejects a latitude provided without a longitude', () => {
      expect(() => GeoLocation.createOptional(48.8566, undefined)).toThrow(IncompleteGeoLocationError);
    });

    it('rejects a longitude provided without a latitude', () => {
      expect(() => GeoLocation.createOptional(undefined, 2.3522)).toThrow(IncompleteGeoLocationError);
    });

    it('still enforces valid bounds when both coordinates are provided', () => {
      expect(() => GeoLocation.createOptional(200, 2.3522)).toThrow(InvalidGeoLocationError);
    });
  });
});
