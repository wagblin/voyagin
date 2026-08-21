import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryImageUploader } from '../CloudinaryImageUploader';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

describe('CloudinaryImageUploader', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('configures the cloudinary SDK with the given credentials', () => {
    new CloudinaryImageUploader({ cloudName: 'demo', apiKey: 'key', apiSecret: 'secret' });

    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'demo',
      api_key: 'key',
      api_secret: 'secret',
    });
  });

  it('resolves with the secure URL returned by Cloudinary', async () => {
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (
        _options: unknown,
        callback: (error: Error | null, result?: { secure_url: string }) => void,
      ) => {
        callback(null, { secure_url: 'https://res.cloudinary.com/demo/image/upload/photo.jpg' });
        return { end: jest.fn() };
      },
    );

    const uploader = new CloudinaryImageUploader({
      cloudName: 'demo',
      apiKey: 'key',
      apiSecret: 'secret',
    });

    await expect(uploader.upload(Buffer.from('fake-image-bytes'))).resolves.toBe(
      'https://res.cloudinary.com/demo/image/upload/photo.jpg',
    );
  });

  it('rejects when Cloudinary returns an error', async () => {
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (
        _options: unknown,
        callback: (error: Error | null, result?: { secure_url: string }) => void,
      ) => {
        callback(new Error('upload failed'), undefined);
        return { end: jest.fn() };
      },
    );

    const uploader = new CloudinaryImageUploader({
      cloudName: 'demo',
      apiKey: 'key',
      apiSecret: 'secret',
    });

    await expect(uploader.upload(Buffer.from('fake-image-bytes'))).rejects.toThrow(
      'upload failed',
    );
  });
});
