import { Photo } from './Photo';
import { GeoLocation } from './GeoLocation';
import { PhotoRepository } from './PhotoRepository';
import { NotTripParticipantError } from './errors';
import { TripId } from '../trip/TripId';
import { TripRepository } from '../trip/TripRepository';
import { TripNotFoundError } from '../trip/errors';

export interface AddPhotoToTripInput {
  tripId: string;
  uploaderId: string;
  imageUrl: string;
  latitude: number | undefined;
  longitude: number | undefined;
  takenAt: Date;
  caption?: string;
}

export class AddPhotoToTripUseCase {
  constructor(
    private readonly photoRepository: PhotoRepository,
    private readonly tripRepository: TripRepository,
  ) {}

  async execute(input: AddPhotoToTripInput): Promise<Photo> {
    const trip = await this.tripRepository.findById(TripId.create(input.tripId));
    if (!trip) {
      throw new TripNotFoundError(input.tripId);
    }

    const isParticipant = trip
      .getParticipants()
      .some((participant) => participant.userId === input.uploaderId);
    if (!isParticipant) {
      throw new NotTripParticipantError(input.uploaderId);
    }

    const location = GeoLocation.createOptional(input.latitude, input.longitude);

    const photo = Photo.create({
      tripId: input.tripId,
      uploaderId: input.uploaderId,
      imageUrl: input.imageUrl,
      takenAt: input.takenAt,
      ...(location !== undefined ? { location } : {}),
      ...(input.caption !== undefined ? { caption: input.caption } : {}),
    });

    await this.photoRepository.save(photo);
    return photo;
  }
}
