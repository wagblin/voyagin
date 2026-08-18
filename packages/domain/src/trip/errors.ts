export class InvalidTripNameError extends Error {
  constructor() {
    super('Trip name must not be empty.');
    this.name = 'InvalidTripNameError';
  }
}

export class InvalidDateRangeError extends Error {
  constructor(start: Date, end: Date) {
    super(
      `Trip end date (${end.toISOString()}) cannot be before start date (${start.toISOString()}).`,
    );
    this.name = 'InvalidDateRangeError';
  }
}

export class DuplicateParticipantError extends Error {
  constructor(userId: string) {
    super(`Participant ${userId} has already joined this trip.`);
    this.name = 'DuplicateParticipantError';
  }
}

export class TripNotFoundError extends Error {
  constructor(tripId: string) {
    super(`Trip ${tripId} was not found.`);
    this.name = 'TripNotFoundError';
  }
}

export class NotTripOwnerError extends Error {
  constructor(userId: string) {
    super(`${userId} is not the owner of this trip and cannot modify it.`);
    this.name = 'NotTripOwnerError';
  }
}
