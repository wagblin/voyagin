export type LatLngInputResult =
  | { kind: 'none' }
  | { kind: 'invalid' }
  | { kind: 'valid'; latitude: number; longitude: number }

export function parseLatLngInput(latitudeInput: string, longitudeInput: string): LatLngInputResult {
  const trimmedLatitude = latitudeInput.trim()
  const trimmedLongitude = longitudeInput.trim()

  if (trimmedLatitude === '' && trimmedLongitude === '') {
    return { kind: 'none' }
  }

  if (trimmedLatitude === '' || trimmedLongitude === '') {
    return { kind: 'invalid' }
  }

  const latitude = Number(trimmedLatitude)
  const longitude = Number(trimmedLongitude)

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { kind: 'invalid' }
  }

  return { kind: 'valid', latitude, longitude }
}
