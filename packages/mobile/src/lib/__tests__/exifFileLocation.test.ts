import { gps, parse } from 'exifr';
import { extractDateTakenFromFileUri, extractGpsFromFileUri } from '../exifFileLocation';

interface LegacyFileSystemModule {
  readAsStringAsync: (fileUri: string, options?: { encoding?: 'utf8' | 'base64' }) => Promise<string>;
  EncodingType: { UTF8: 'utf8'; Base64: 'base64' };
}

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('exifr', () => ({ gps: jest.fn(), parse: jest.fn() }));

// expo-file-system/legacy n'a pas de .d.ts publié pour ce sous-chemin : un `import` statique force
// tsc à type-checker le fichier source réel du package sous notre exactOptionalPropertyTypes, qui échoue
// sur un type interne à expo-file-system, sans rapport avec notre usage. require() évite cette résolution
// statique tout en récupérant exactement le même mock que jest.mock ci-dessus intercepte au runtime.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- interop nécessaire, voir commentaire ci-dessus
const FileSystem = require('expo-file-system/legacy') as LegacyFileSystemModule;

describe('extractGpsFromFileUri', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the coordinates found in the file EXIF metadata', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('ZmFrZS1ieXRlcw==');
    jest.mocked(gps).mockResolvedValue({ latitude: 48.8566, longitude: 2.3522 });

    await expect(extractGpsFromFileUri('file:///tmp/imported.jpg')).resolves.toEqual({
      latitude: 48.8566,
      longitude: 2.3522,
    });
  });

  it('returns null when the file has no GPS metadata', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('ZmFrZS1ieXRlcw==');
    jest.mocked(gps).mockResolvedValue(undefined);

    await expect(extractGpsFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });

  it('returns null instead of throwing when the file cannot be read', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockRejectedValue(new Error('file not found'));

    await expect(extractGpsFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });

  it('returns null instead of throwing when EXIF parsing fails', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('ZmFrZS1ieXRlcw==');
    jest.mocked(gps).mockRejectedValue(new Error('unsupported format'));

    await expect(extractGpsFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });
});

describe('extractDateTakenFromFileUri', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the date the photo was taken as an ISO-like local string', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('ZmFrZS1ieXRlcw==');
    jest.mocked(parse).mockResolvedValue({ DateTimeOriginal: new Date('2024-03-15T14:23:00') });

    await expect(extractDateTakenFromFileUri('file:///tmp/imported.jpg')).resolves.toBe('2024-03-15T14:23:00');
  });

  it('returns null when the file has no DateTimeOriginal metadata', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('ZmFrZS1ieXRlcw==');
    jest.mocked(parse).mockResolvedValue({});

    await expect(extractDateTakenFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });

  it('returns null instead of throwing when the file cannot be read', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockRejectedValue(new Error('file not found'));

    await expect(extractDateTakenFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });

  it('returns null instead of throwing when EXIF parsing fails', async () => {
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('ZmFrZS1ieXRlcw==');
    jest.mocked(parse).mockRejectedValue(new Error('unsupported format'));

    await expect(extractDateTakenFromFileUri('file:///tmp/imported.jpg')).resolves.toBeNull();
  });
});
