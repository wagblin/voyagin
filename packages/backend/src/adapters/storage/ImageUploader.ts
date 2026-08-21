export interface ImageUploader {
  upload(fileBuffer: Buffer): Promise<string>;
}
