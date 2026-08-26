import piexif from 'piexifjs';
import { parseExifDateTaken, type ExifCoordinates } from './exifLocation';

interface LegacyFileSystemModule {
  readAsStringAsync: (fileUri: string, options?: { encoding?: 'utf8' | 'base64' }) => Promise<string>;
  EncodingType: { UTF8: 'utf8'; Base64: 'base64' };
}

// expo-file-system/legacy n'a pas de .d.ts publié pour ce sous-chemin : un `import` statique force
// tsc à type-checker le fichier source réel du package sous notre exactOptionalPropertyTypes, qui échoue
// sur un type interne à expo-file-system, sans rapport avec notre usage. require() évite cette résolution
// statique tout en chargeant exactement le même module au runtime (Metro/Jest transpilent import en require).
// eslint-disable-next-line @typescript-eslint/no-require-imports -- interop nécessaire, voir commentaire ci-dessus
const FileSystem = require('expo-file-system/legacy') as LegacyFileSystemModule;

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// piexifjs expects a "binary string" (one JS string character = one byte, values 0-255), not a
// byte array — this is the string representation used by browser-era EXIF tooling. Decoded here
// character by character rather than via `atob`/`Buffer`: neither is guaranteed to exist under
// Hermes on React Native, and a hidden dependency on either has already caused a production crash
// once this session (see exifr replacement below) — no shortcuts.
export function decodeBase64ToBinaryString(base64: string): string {
  const cleaned = base64.replace(/[^A-Za-z0-9+/]/g, '');
  let binaryString = '';
  let buffer = 0;
  let bitsInBuffer = 0;

  for (const char of cleaned) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bitsInBuffer += 6;
    if (bitsInBuffer >= 8) {
      bitsInBuffer -= 8;
      binaryString += String.fromCharCode((buffer >> bitsInBuffer) & 0xff);
    }
  }

  return binaryString;
}

async function readFileAsBinaryString(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return decodeBase64ToBinaryString(base64);
}

// Best-effort extraction of GPS coordinates from a file's EXIF metadata, for images imported via
// the document picker (which — unlike the image picker — doesn't return EXIF data directly, only
// a file URI). Reads the file as base64, decodes it to a binary string, and lets piexifjs (zero
// dependencies, no `navigator`/`atob`/`Buffer` usage — unlike the previous `exifr`-based
// implementation, which crashed iOS Release builds under Hermes) parse the GPS tags. Many files
// have no GPS metadata, and reading/parsing can fail for unsupported formats — none of that is an
// error, so this always resolves to `null` instead of throwing.
export async function extractGpsFromFileUri(uri: string): Promise<ExifCoordinates | null> {
  try {
    const binaryString = await readFileAsBinaryString(uri);
    const exifDict = piexif.load(binaryString);
    const latitude = exifDict.GPS?.[piexif.GPSIFD.GPSLatitude];
    const latitudeRef = exifDict.GPS?.[piexif.GPSIFD.GPSLatitudeRef];
    const longitude = exifDict.GPS?.[piexif.GPSIFD.GPSLongitude];
    const longitudeRef = exifDict.GPS?.[piexif.GPSIFD.GPSLongitudeRef];
    if (latitude === undefined || latitudeRef === undefined || longitude === undefined || longitudeRef === undefined) {
      return null;
    }

    const parsedLatitude = piexif.GPSHelper.dmsRationalToDeg(latitude, latitudeRef);
    const parsedLongitude = piexif.GPSHelper.dmsRationalToDeg(longitude, longitudeRef);
    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      return null;
    }
    // Many Android camera/gallery apps write a placeholder GPS tag (0/1,0/1,0/1, empty Ref) to mean
    // "no real GPS data was available", instead of omitting the GPS IFD entirely. This converts to
    // the finite number 0, so it passes the check above — but (0, 0) is Null Island, never a real
    // location for this app, so it's treated the same as the NaN case: no GPS data.
    if (parsedLatitude === 0 && parsedLongitude === 0) {
      return null;
    }

    return { latitude: parsedLatitude, longitude: parsedLongitude };
  } catch {
    return null;
  }
}

// Best-effort extraction of the date a file's photo was taken from its EXIF metadata, for images
// imported via the document picker. Reads the file as base64, decodes it to a binary string, and
// lets piexifjs parse the DateTimeOriginal tag — reusing `parseExifDateTaken` (shared with the
// image picker's EXIF handling) rather than duplicating the "YYYY:MM:DD HH:mm:ss" parsing logic.
// Many files have no such metadata, and reading/parsing can fail for unsupported formats — none of
// that is an error, so this always resolves to `null` instead of throwing.
export async function extractDateTakenFromFileUri(uri: string): Promise<string | null> {
  try {
    const binaryString = await readFileAsBinaryString(uri);
    const exifDict = piexif.load(binaryString);
    const dateTimeOriginal = exifDict.Exif?.[piexif.ExifIFD.DateTimeOriginal];
    return parseExifDateTaken({ DateTimeOriginal: dateTimeOriginal });
  } catch {
    return null;
  }
}
