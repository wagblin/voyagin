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
