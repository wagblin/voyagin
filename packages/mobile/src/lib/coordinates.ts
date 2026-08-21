export interface LatLng {
  latitude: number;
  longitude: number;
}

function toNumber(input: string): number | null {
  if (input.trim() === '') {
    return null;
  }
  const parsed = Number(input);
  return Number.isNaN(parsed) ? null : parsed;
}

// Parses the free-text latitude/longitude fields a user can edit before confirming a photo's
// location. Returns `null` whenever either field is empty, whitespace-only, or not a valid
// number, so callers can disable submission without needing to duplicate this validation.
export function parseLatLngInput(latitudeInput: string, longitudeInput: string): LatLng | null {
  const latitude = toNumber(latitudeInput);
  const longitude = toNumber(longitudeInput);
  if (latitude === null || longitude === null) {
    return null;
  }

  return { latitude, longitude };
}
