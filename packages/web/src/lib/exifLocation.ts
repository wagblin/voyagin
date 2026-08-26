import { gps, parse } from 'exifr'

export interface ExifGpsLocation {
  latitude: number
  longitude: number
}

export async function extractGpsFromFile(file: File): Promise<ExifGpsLocation | null> {
  try {
    const coordinates = await gps(file)
    if (!coordinates) {
      return null
    }
    if (!Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)) {
      return null
    }
    // Many Android camera/gallery apps write a placeholder GPS tag (0, 0) to mean "no real GPS
    // data was available", instead of omitting the GPS metadata entirely. (0, 0) is Null Island,
    // never a real location for this app, so it's treated the same as the NaN case: no GPS data.
    // Mirrors the equivalent guard in packages/mobile/src/lib/exifFileLocation.ts.
    if (coordinates.latitude === 0 && coordinates.longitude === 0) {
      return null
    }
    return coordinates
  } catch {
    return null
  }
}

export async function extractDateTakenFromFile(file: File): Promise<string | null> {
  try {
    const exif = await parse(file)
    const dateTaken = exif?.DateTimeOriginal
    if (!(dateTaken instanceof Date)) {
      return null
    }
    const year = dateTaken.getFullYear()
    const month = String(dateTaken.getMonth() + 1).padStart(2, '0')
    const day = String(dateTaken.getDate()).padStart(2, '0')
    const hours = String(dateTaken.getHours()).padStart(2, '0')
    const minutes = String(dateTaken.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return null
  }
}
