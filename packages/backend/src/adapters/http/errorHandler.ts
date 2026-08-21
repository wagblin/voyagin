import { NextFunction, Request, Response } from 'express';
import {
  InvalidEmailError,
  InvalidUserNameError,
  WeakPasswordError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  UserNotFoundError,
  InvalidTripNameError,
  InvalidDateRangeError,
  DuplicateParticipantError,
  TripNotFoundError,
  NotTripOwnerError,
  ParticipantNotFoundError,
  CannotRemoveOwnerError,
  InvalidGeoLocationError,
  InvalidImageUrlError,
  InvalidTripIdError,
  InvalidUploaderIdError,
  PhotoNotFoundError,
  NotTripParticipantError,
  NotAllowedToDeletePhotoError,
} from '@voyagin/domain';

const STATUS_BY_ERROR_NAME: Record<string, number> = {
  InvalidEmailError: 400,
  InvalidUserNameError: 400,
  WeakPasswordError: 400,
  InvalidTripNameError: 400,
  InvalidDateRangeError: 400,
  DuplicateParticipantError: 400,
  InvalidGeoLocationError: 400,
  InvalidImageUrlError: 400,
  InvalidTripIdError: 400,
  InvalidUploaderIdError: 400,
  InvalidCredentialsError: 401,
  NotTripOwnerError: 403,
  NotTripParticipantError: 403,
  NotAllowedToDeletePhotoError: 403,
  UserNotFoundError: 404,
  TripNotFoundError: 404,
  ParticipantNotFoundError: 404,
  PhotoNotFoundError: 404,
  EmailAlreadyRegisteredError: 409,
  CannotRemoveOwnerError: 409,
};

const KNOWN_ERROR_CLASSES = [
  InvalidEmailError,
  InvalidUserNameError,
  WeakPasswordError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  UserNotFoundError,
  InvalidTripNameError,
  InvalidDateRangeError,
  DuplicateParticipantError,
  TripNotFoundError,
  NotTripOwnerError,
  ParticipantNotFoundError,
  CannotRemoveOwnerError,
  InvalidGeoLocationError,
  InvalidImageUrlError,
  InvalidTripIdError,
  InvalidUploaderIdError,
  PhotoNotFoundError,
  NotTripParticipantError,
  NotAllowedToDeletePhotoError,
];

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const matchedClass = KNOWN_ERROR_CLASSES.find((ErrorClass) => err instanceof ErrorClass);
  if (matchedClass && err instanceof Error) {
    res.status(STATUS_BY_ERROR_NAME[matchedClass.name] ?? 400).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
}
