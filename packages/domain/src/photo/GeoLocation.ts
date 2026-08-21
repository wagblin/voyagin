import { InvalidGeoLocationError } from './errors';

export class GeoLocation {
  private constructor(
    public readonly latitude: number,
    public readonly longitude: number,
  ) {}

  static create(latitude: number, longitude: number): GeoLocation {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new InvalidGeoLocationError(latitude, longitude);
    }
    return new GeoLocation(latitude, longitude);
  }
}
