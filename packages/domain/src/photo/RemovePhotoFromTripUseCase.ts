import { PhotoId } from './PhotoId';
import { PhotoRepository } from './PhotoRepository';
import { PhotoNotFoundError, NotAllowedToDeletePhotoError } from './errors';
import { TripId } from '../trip/TripId';
import { TripRepository } from '../trip/TripRepository';
import { TripNotFoundError } from '../trip/errors';

export interface RemovePhotoFromTripInput {
  photoId: string;
  requesterId: string;
}

export class RemovePhotoFromTripUseCase {
  constructor(
    private readonly photoRepository: PhotoRepository,
    private readonly tripRepository: TripRepository,
  ) {}

  async execute(input: RemovePhotoFromTripInput): Promise<void> {
    const photo = await this.photoRepository.findById(PhotoId.create(input.photoId));
    if (!photo) {
      throw new PhotoNotFoundError(input.photoId);
    }

    const trip = await this.tripRepository.findById(TripId.create(photo.getTripId()));
    if (!trip) {
      throw new TripNotFoundError(photo.getTripId());
    }

    const isUploader = photo.getUploaderId() === input.requesterId;
    const isTripOwner = trip.isOwnedBy(input.requesterId);
    if (!isUploader && !isTripOwner) {
      throw new NotAllowedToDeletePhotoError(input.requesterId);
    }

    await this.photoRepository.delete(photo.id);
  }
}
