import {
  InMemoryPasswordHasher,
  InMemoryPhotoRepository,
  InMemoryTripRepository,
  InMemoryUserRepository,
} from '@voyagin/domain';
import { buildApp } from '../infrastructure/app';
import { JwtTokenService } from '../adapters/security/JwtTokenService';
import { PowerSyncTokenService } from '../adapters/security/PowerSyncTokenService';
import { TokenBlocklist } from '../adapters/security/TokenBlocklist';
import type { ImageUploader } from '../adapters/storage/ImageUploader';

export const TEST_POWERSYNC_INSTANCE_URL = 'https://test-instance.powersync.journeyapps.com';

export class FakeImageUploader implements ImageUploader {
  upload(): Promise<string> {
    return Promise.resolve('https://res.cloudinary.com/demo/image/upload/fake.jpg');
  }
}

export function buildTestApp() {
  return buildApp({
    tripRepository: new InMemoryTripRepository(),
    userRepository: new InMemoryUserRepository(),
    passwordHasher: new InMemoryPasswordHasher(),
    tokenService: new JwtTokenService('test-secret'),
    tokenBlocklist: new TokenBlocklist(),
    powerSyncTokenService: new PowerSyncTokenService('test-secret', TEST_POWERSYNC_INSTANCE_URL),
    photoRepository: new InMemoryPhotoRepository(),
    imageUploader: new FakeImageUploader(),
  });
}
