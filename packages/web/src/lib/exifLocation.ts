import { gps, parse } from 'exifr'

export interface ExifGpsLocation {
  latitude: number
  longitude: number
}

export async function extractGpsFromFile(file: File): Promise<ExifGpsLocation | null> {
  try {
    const coordinates = await gps(file)
    return coordinates ?? null
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
