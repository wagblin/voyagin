import piexif from 'piexifjs';
import * as exifLocation from '../exifLocation';
import {
  decodeBase64ToBinaryString,
  extractDateTakenFromFileUri,
  extractGpsFromFileUri,
} from '../exifFileLocation';

interface LegacyFileSystemModule {
  readAsStringAsync: (fileUri: string, options?: { encoding?: 'utf8' | 'base64' }) => Promise<string>;
  EncodingType: { UTF8: 'utf8'; Base64: 'base64' };
}

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('piexifjs', () => {
  const actual = jest.requireActual('piexifjs');
  return {
    ...actual,
    load: jest.fn(),
    GPSHelper: { ...actual.GPSHelper, dmsRationalToDeg: jest.fn() },
  };
});

jest.mock('../exifLocation', () => {
  const actual = jest.requireActual('../exifLocation');
  return { ...actual, parseExifDateTaken: jest.fn(actual.parseExifDateTaken) };
});

// expo-file-system/legacy n'a pas de .d.ts publié pour ce sous-chemin : un `import` statique force
// tsc à type-checker le fichier source réel du package sous notre exactOptionalPropertyTypes, qui échoue
// sur un type interne à expo-file-system, sans rapport avec notre usage. require() évite cette résolution
// statique tout en récupérant exactement le même mock que jest.mock ci-dessus intercepte au runtime.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- interop nécessaire, voir commentaire ci-dessus
const FileSystem = require('expo-file-system/legacy') as LegacyFileSystemModule;

const FAKE_FILE_BASE64 = 'ZmFrZS1ieXRlcw==';

const GPS_LATITUDE_DMS = [
  [48, 1],
  [51, 1],
  [3696, 100],
];
const GPS_LONGITUDE_DMS = [
  [2, 1],
  [21, 1],
  [880, 100],
];

function mockGpsConversion(): void {
  jest.mocked(piexif.GPSHelper.dmsRationalToDeg).mockImplementation((_dms, ref) => {
    if (ref === 'N' || ref === 'S') {
      return 48.8566;
    }
    return 2.3522;
  });
}

describe('decodeBase64ToBinaryString', () => {
  it('decodes a base64 string of printable ASCII characters', () => {
    expect(decodeBase64ToBinaryString('aGVsbG8=')).toBe('hello');
  });

  it('decodes an empty string to an empty string', () => {
    expect(decodeBase64ToBinaryString('')).toBe('');
  });

  it('decodes to a raw binary string usable by piexifjs, one character per byte', () => {
    const jpegSoiMarkerBase64 = Buffer.from([0xff, 0xd8]).toString('base64');

    expect(decodeBase64ToBinaryString(jpegSoiMarkerBase64)).toBe(String.fromCharCode(0xff, 0xd8));
  });
});

describe('extractGpsFromFileUri', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the coordinates found in the file EXIF metadata', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(FAKE_FILE_BASE64);
    mockGpsConversion();
    jest.mocked(piexif.load).mockReturnValue({
      GPS: {
        [piexif.GPSIFD.GPSLatitude]: GPS_LATITUDE_DMS,
        [piexif.GPSIFD.GPSLatitudeRef]: 'N',
        [piexif.GPSIFD.GPSLongitude]: GPS_LONGITUDE_DMS,
        [piexif.GPSIFD.GPSLongitudeRef]: 'E',
      },
    });

    await expect(extractGpsFromFileUri('file:///tmp/imported.jpg')).resolves.toEqual({
      latitude: 48.8566,
      longitude: 2.3522,
    });
  });

  it('returns null instead of NaN coordinates when the GPS tags are present but malformed', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(FAKE_FILE_BASE64);
    jest.mocked(piexif.GPSHelper.dmsRationalToDeg).mockReturnValue(NaN);
    jest.mocked(piexif.load).mockReturnValue({
      GPS: {
        [piexif.GPSIFD.GPSLatitude]: GPS_LATITUDE_DMS,
        [piexif.GPSIFD.GPSLatitudeRef]: 'N',
        [piexif.GPSIFD.GPSLongitude]: GPS_LONGITUDE_DMS,
        [piexif.GPSIFD.GPSLongitudeRef]: 'E',
      },
    });

    await expect(extractGpsFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });

  it('returns null instead of (0, 0) when the GPS tags carry the Android placeholder sentinel', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(FAKE_FILE_BASE64);
    jest.mocked(piexif.GPSHelper.dmsRationalToDeg).mockReturnValue(0);
    jest.mocked(piexif.load).mockReturnValue({
      GPS: {
        [piexif.GPSIFD.GPSLatitude]: [[0, 1], [0, 1], [0, 1]],
        [piexif.GPSIFD.GPSLatitudeRef]: '',
        [piexif.GPSIFD.GPSLongitude]: [[0, 1], [0, 1], [0, 1]],
        [piexif.GPSIFD.GPSLongitudeRef]: '',
      },
    });

    await expect(extractGpsFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });

  it('returns null when the file has no GPS metadata', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(FAKE_FILE_BASE64);
    jest.mocked(piexif.load).mockReturnValue({});

    await expect(extractGpsFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });

  it('returns null instead of throwing when the file cannot be read', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockRejectedValue(new Error('file not found'));

    await expect(extractGpsFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });

  it('returns null instead of throwing when the file is not a valid JPEG', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(FAKE_FILE_BASE64);
    jest.mocked(piexif.load).mockImplementation(() => {
      throw new Error('Given input is not a JPEG.');
    });

    await expect(extractGpsFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });
});

describe('extractDateTakenFromFileUri', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the date the photo was taken as an ISO-like local string', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(FAKE_FILE_BASE64);
    jest.mocked(piexif.load).mockReturnValue({
      Exif: { [piexif.ExifIFD.DateTimeOriginal]: '2024:03:15 14:23:00' },
    });

    await expect(extractDateTakenFromFileUri('file:///tmp/imported.jpg')).resolves.toBe('2024-03-15T14:23:00');
  });

  it('reuses the same EXIF date parsing logic as parseExifDateTaken', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(FAKE_FILE_BASE64);
    jest.mocked(piexif.load).mockReturnValue({
      Exif: { [piexif.ExifIFD.DateTimeOriginal]: '2024:03:15 14:23:00' },
    });

    await extractDateTakenFromFileUri('file:///tmp/imported.jpg');

    expect(exifLocation.parseExifDateTaken).toHaveBeenCalledWith(
      expect.objectContaining({ DateTimeOriginal: '2024:03:15 14:23:00' }),
    );
  });

  it('returns null when the file has no DateTimeOriginal metadata', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(FAKE_FILE_BASE64);
    jest.mocked(piexif.load).mockReturnValue({});

    await expect(extractDateTakenFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });

  it('returns null instead of throwing when the file cannot be read', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockRejectedValue(new Error('file not found'));

    await expect(extractDateTakenFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });

  it('returns null instead of throwing when the file is not a valid JPEG', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(FAKE_FILE_BASE64);
    jest.mocked(piexif.load).mockImplementation(() => {
      throw new Error('Given input is not a JPEG.');
    });

    await expect(extractDateTakenFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });
});
