import { z } from 'zod';
import {
  AddPhotoToTripUseCase,
  PhotoRepository,
  RemovePhotoFromTripUseCase,
  TripId,
  TripRepository,
} from '@voyagin/domain';
import { asyncHandler } from './asyncHandler';
import { serializePhoto } from './serializers';
import type { ImageUploader } from '../storage/ImageUploader';

const addPhotoSchema = z.object({
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  takenAt: z.coerce.date().optional(),
  caption: z.string().trim().min(1).optional(),
});

export interface PhotoControllerDependencies {
  photoRepository: PhotoRepository;
  tripRepository: TripRepository;
  imageUploader: ImageUploader;
}

export function buildPhotoController(deps: PhotoControllerDependencies) {
  const addPhoto = asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'An image file is required.' });
      return;
    }

    const parsed = addPhotoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const imageUrl = await deps.imageUploader.upload(req.file.buffer);

    const useCase = new AddPhotoToTripUseCase(deps.photoRepository, deps.tripRepository);
    const photo = await useCase.execute({
      tripId: req.params['id']!,
      uploaderId: req.userId as string,
      imageUrl,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      takenAt: parsed.data.takenAt ?? new Date(),
      ...(parsed.data.caption !== undefined ? { caption: parsed.data.caption } : {}),
    });

    res.status(201).json(serializePhoto(photo));
  });

  const listTripPhotos = asyncHandler(async (req, res) => {
    const trip = await deps.tripRepository.findById(TripId.create(req.params['id']!));

    if (!trip || !trip.getParticipants().some((p) => p.userId === req.userId)) {
      res.status(403).json({ error: 'You are not a participant of this trip.' });
      return;
    }

    const photos = await deps.photoRepository.findByTrip(req.params['id']!);
    res.status(200).json(photos.map(serializePhoto));
  });

  const deletePhoto = asyncHandler(async (req, res) => {
    const useCase = new RemovePhotoFromTripUseCase(deps.photoRepository, deps.tripRepository);
    await useCase.execute({
      photoId: req.params['id']!,
      requesterId: req.userId as string,
    });

    res.status(204).send();
  });

  return { addPhoto, listTripPhotos, deletePhoto };
}
