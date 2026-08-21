import type { ExifCoordinates } from './exifLocation';

interface LegacyFileSystemModule {
  readAsStringAsync: (fileUri: string, options?: { encoding?: 'utf8' | 'base64' }) => Promise<string>;
  EncodingType: { UTF8: 'utf8'; Base64: 'base64' };
}

interface ExifrModule {
  gps: (input: Uint8Array) => Promise<{ latitude: number; longitude: number } | undefined>;
  parse: (input: Uint8Array) => Promise<{ DateTimeOriginal?: Date } | undefined>;
}

// expo-file-system/legacy n'a pas de .d.ts publié pour ce sous-chemin : un `import` statique force
// tsc à type-checker le fichier source réel du package sous notre exactOptionalPropertyTypes, qui échoue
// sur un type interne à expo-file-system, sans rapport avec notre usage. require() évite cette résolution
// statique tout en chargeant exactement le même module au runtime (Metro/Jest transpilent import en require).
// eslint-disable-next-line @typescript-eslint/no-require-imports -- interop nécessaire, voir commentaire ci-dessus
const FileSystem = require('expo-file-system/legacy') as LegacyFileSystemModule;

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64ToBytes(base64: string): Uint8Array {
  const cleaned = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const byteLength = Math.floor((cleaned.length * 6) / 8);
  const bytes = new Uint8Array(byteLength);

  let byteIndex = 0;
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
      bytes[byteIndex] = (buffer >> bitsInBuffer) & 0xff;
      byteIndex += 1;
    }
  }

  return bytes;
}

async function readFileBytes(uri: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return decodeBase64ToBytes(base64);
}

// exifr lit `navigator.userAgent` dans le code de son module (pas dans une fonction) pour
// détecter iPad, en supposant qu'il est toujours défini. Sur un vrai appareil RN (Hermes),
// `navigator` existe mais `navigator.userAgent` est `undefined`, ce qui fait planter exifr dès
// son chargement. On force une valeur sûre juste avant le `require()` paresseux ci-dessous,
// qui reporte le chargement/exécution du module exifr jusqu'ici plutôt qu'au chargement du bundle.
function loadExifr(): ExifrModule {
  if (typeof navigator === 'object' && navigator.userAgent === undefined) {
    (navigator as { userAgent: string }).userAgent = 'ReactNative';
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports -- chargement paresseux nécessaire, voir commentaire ci-dessus
  return require('exifr') as ExifrModule;
}

// Best-effort extraction of GPS coordinates from a file's EXIF metadata, for images imported via
// the document picker (which — unlike the image picker — doesn't return EXIF data directly, only
// a file URI). Reads the file as base64, decodes it to bytes, and lets exifr parse the GPS tags.
// Many files have no GPS metadata, and reading/parsing can fail for unsupported formats — none of
// that is an error, so this always resolves to `null` instead of throwing.
export async function extractGpsFromFileUri(uri: string): Promise<ExifCoordinates | null> {
  try {
    const bytes = await readFileBytes(uri);
    const { gps } = loadExifr();
    const coordinates = await gps(bytes);
    if (!coordinates) {
      return null;
    }

    return { latitude: coordinates.latitude, longitude: coordinates.longitude };
  } catch {
    return null;
  }
}

function formatLocalDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Best-effort extraction of the date a file's photo was taken from its EXIF metadata, for images
// imported via the document picker. Reads the file as base64, decodes it to bytes, and lets exifr
// parse the DateTimeOriginal tag, which it returns as a `Date` object — formatted here in local
// time (not `toISOString()`, which is UTC). Many files have no such metadata, and reading/parsing
// can fail for unsupported formats — none of that is an error, so this always resolves to `null`
// instead of throwing.
export async function extractDateTakenFromFileUri(uri: string): Promise<string | null> {
  try {
    const bytes = await readFileBytes(uri);
    const { parse } = loadExifr();
    const metadata = await parse(bytes);
    if (!metadata?.DateTimeOriginal) {
      return null;
    }

    return formatLocalDateTime(metadata.DateTimeOriginal);
  } catch {
    return null;
  }
}
