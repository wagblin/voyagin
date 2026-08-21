import { Photo, Trip, User } from '@voyagin/domain';

export function serializeUser(user: User) {
  return {
    id: user.id.toString(),
    email: user.getEmail().toString(),
    name: user.getName(),
  };
}

export function serializeTrip(trip: Trip) {
  const dateRange = trip.getDateRange();
  return {
    id: trip.id.toString(),
    name: trip.getName(),
    dateRange: dateRange ? { start: dateRange.start, end: dateRange.end } : null,
    participants: trip.getParticipants().map((participant) => ({
      userId: participant.userId,
      name: participant.name,
      role: participant.role,
    })),
  };
}

export function serializePhoto(photo: Photo) {
  return {
    id: photo.id.toString(),
    tripId: photo.getTripId(),
    uploaderId: photo.getUploaderId(),
    imageUrl: photo.getImageUrl(),
    location: {
      latitude: photo.getLocation().latitude,
      longitude: photo.getLocation().longitude,
    },
    takenAt: photo.getTakenAt(),
    caption: photo.getCaption() ?? null,
  };
}
