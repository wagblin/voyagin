export interface LatLng {
  latitude: number;
  longitude: number;
}

export type ParsedLatLngInput =
  | { kind: 'none' }
  | { kind: 'invalid' }
  | ({ kind: 'valid' } & LatLng);

function toNumber(input: string): number | null {
  if (input.trim() === '') {
    return null;
  }
  const parsed = Number(input);
  return Number.isNaN(parsed) ? null : parsed;
}

// Parses the free-text latitude/longitude fields a user can edit before confirming a photo's
// location. Both fields empty means the photo has no location (allowed). Exactly one filled, or
// either filled with a non-numeric value, is invalid and blocks submission.
export function parseLatLngInput(latitudeInput: string, longitudeInput: string): ParsedLatLngInput {
  if (latitudeInput.trim() === '' && longitudeInput.trim() === '') {
    return { kind: 'none' };
  }

  const latitude = toNumber(latitudeInput);
  const longitude = toNumber(longitudeInput);
  if (latitude === null || longitude === null) {
    return { kind: 'invalid' };
  }

  return { kind: 'valid', latitude, longitude };
}
