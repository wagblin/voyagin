import { PhotoId } from './PhotoId';
import { GeoLocation } from './GeoLocation';
import { InvalidImageUrlError, InvalidTripIdError, InvalidUploaderIdError } from './errors';

export interface CreatePhotoProps {
  tripId: string;
  uploaderId: string;
  imageUrl: string;
  location?: GeoLocation;
  takenAt: Date;
  caption?: string;
}

export interface ReconstitutePhotoProps {
  id: string;
  tripId: string;
  uploaderId: string;
  imageUrl: string;
  location?: GeoLocation;
  takenAt: Date;
  caption?: string;
}

export class Photo {
  private constructor(
    public readonly id: PhotoId,
    private readonly tripId: string,
    private readonly uploaderId: string,
    private readonly imageUrl: string,
    private readonly location: GeoLocation | undefined,
    private readonly takenAt: Date,
    private readonly caption: string | undefined,
  ) {}

  static create(props: CreatePhotoProps): Photo {
    if (props.imageUrl.trim().length === 0) {
      throw new InvalidImageUrlError();
    }
    if (props.tripId.trim().length === 0) {
      throw new InvalidTripIdError();
    }
    if (props.uploaderId.trim().length === 0) {
      throw new InvalidUploaderIdError();
    }
    return new Photo(
      PhotoId.generate(),
      props.tripId,
      props.uploaderId,
      props.imageUrl,
      props.location,
      props.takenAt,
      props.caption,
    );
  }

  static reconstitute(props: ReconstitutePhotoProps): Photo {
    return new Photo(
      PhotoId.create(props.id),
      props.tripId,
      props.uploaderId,
      props.imageUrl,
      props.location,
      props.takenAt,
      props.caption,
    );
  }

  getTripId(): string {
    return this.tripId;
  }

  getUploaderId(): string {
    return this.uploaderId;
  }

  getImageUrl(): string {
    return this.imageUrl;
  }

  getLocation(): GeoLocation | undefined {
    return this.location;
  }

  getTakenAt(): Date {
    return this.takenAt;
  }

  getCaption(): string | undefined {
    return this.caption;
  }
}
