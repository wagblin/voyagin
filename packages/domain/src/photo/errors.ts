export class InvalidGeoLocationError extends Error {
  constructor(latitude: number, longitude: number) {
    super(`Invalid geolocation (${latitude}, ${longitude}).`);
    this.name = 'InvalidGeoLocationError';
  }
}

export class IncompleteGeoLocationError extends Error {
  constructor() {
    super('Geolocation requires both a latitude and a longitude.');
    this.name = 'IncompleteGeoLocationError';
  }
}

export class InvalidImageUrlError extends Error {
  constructor() {
    super('Photo image url must not be empty.');
    this.name = 'InvalidImageUrlError';
  }
}

export class InvalidTripIdError extends Error {
  constructor() {
    super('Photo trip id must not be empty.');
    this.name = 'InvalidTripIdError';
  }
}

export class InvalidUploaderIdError extends Error {
  constructor() {
    super('Photo uploader id must not be empty.');
    this.name = 'InvalidUploaderIdError';
  }
}

export class PhotoNotFoundError extends Error {
  constructor(photoId: string) {
    super(`Photo ${photoId} was not found.`);
    this.name = 'PhotoNotFoundError';
  }
}

export class NotTripParticipantError extends Error {
  constructor(userId: string) {
    super(`${userId} is not a participant of this trip and cannot add a photo to it.`);
    this.name = 'NotTripParticipantError';
  }
}

export class NotAllowedToDeletePhotoError extends Error {
  constructor(userId: string) {
    super(`${userId} is neither the uploader of this photo nor the owner of its trip and cannot delete it.`);
    this.name = 'NotAllowedToDeletePhotoError';
  }
}
