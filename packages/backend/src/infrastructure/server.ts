import { buildApp } from './app';
import { prismaClient } from './prismaClient';
import { PrismaTripRepository } from '../adapters/persistence/PrismaTripRepository';
import { PrismaUserRepository } from '../adapters/persistence/PrismaUserRepository';
import { PrismaPhotoRepository } from '../adapters/persistence/PrismaPhotoRepository';
import { BcryptPasswordHasher } from '../adapters/security/BcryptPasswordHasher';
import { JwtTokenService } from '../adapters/security/JwtTokenService';
import { TokenBlocklist } from '../adapters/security/TokenBlocklist';
import { CloudinaryImageUploader } from '../adapters/storage/CloudinaryImageUploader';

const port = process.env['PORT'] ?? 3000;
const host = process.env['HOST'] ?? '0.0.0.0';
const jwtSecret = process.env['JWT_SECRET'];
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required.');
}

const cloudinaryCloudName = process.env['CLOUDINARY_CLOUD_NAME'];
const cloudinaryApiKey = process.env['CLOUDINARY_API_KEY'];
const cloudinaryApiSecret = process.env['CLOUDINARY_API_SECRET'];
if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
  throw new Error(
    'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET environment variables are required.',
  );
}

const app = buildApp({
  tripRepository: new PrismaTripRepository(prismaClient),
  userRepository: new PrismaUserRepository(prismaClient),
  passwordHasher: new BcryptPasswordHasher(),
  tokenService: new JwtTokenService(jwtSecret),
  tokenBlocklist: new TokenBlocklist(),
  photoRepository: new PrismaPhotoRepository(prismaClient),
  imageUploader: new CloudinaryImageUploader({
    cloudName: cloudinaryCloudName,
    apiKey: cloudinaryApiKey,
    apiSecret: cloudinaryApiSecret,
  }),
});

app.listen(Number(port), host, () => {
  console.log(`VoyagIn API listening on http://${host}:${port}`);
  console.log(`Swagger docs available at http://${host}:${port}/api-docs`);
});
