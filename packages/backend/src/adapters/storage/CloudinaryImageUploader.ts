import { v2 as cloudinary } from 'cloudinary';
import { ImageUploader } from './ImageUploader';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export class CloudinaryImageUploader implements ImageUploader {
  constructor(config: CloudinaryConfig) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });
  }

  upload(fileBuffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'voyagin' },
        (error, result) => {
          if (error || !result) {
            reject(error instanceof Error ? error : new Error('Cloudinary upload failed.'));
            return;
          }
          resolve(result.secure_url);
        },
      );
      uploadStream.end(fileBuffer);
    });
  }
}
