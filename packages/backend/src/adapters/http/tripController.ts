import { z } from 'zod';
import {
  AddParticipantToTripUseCase,
  CreateTripUseCase,
  DateRange,
  DeleteTripUseCase,
  RemoveParticipantFromTripUseCase,
  TripId,
  TripRepository,
  UpdateTripUseCase,
  UserId,
  UserNotFoundError,
  UserRepository,
} from '@voyagin/domain';
import { asyncHandler } from './asyncHandler';
import { serializeTrip } from './serializers';

const createTripSchema = z.object({
  name: z.string().trim().min(1, 'Trip name must not be empty.'),
});

const updateTripSchema = z.object({
  name: z.string().trim().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const addParticipantSchema = z.object({
  email: z.string().trim().email('A valid email is required.'),
});

export interface TripControllerDependencies {
  tripRepository: TripRepository;
  userRepository: UserRepository;
}

export function buildTripController(deps: TripControllerDependencies) {
  const createTrip = asyncHandler(async (req, res) => {
    const parsed = createTripSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const ownerId = req.userId as string;
    const owner = await deps.userRepository.findById(UserId.create(ownerId));
    if (!owner) {
      throw new UserNotFoundError(ownerId);
    }

    const useCase = new CreateTripUseCase(deps.tripRepository);
    const trip = await useCase.execute({
      name: parsed.data.name,
      ownerId,
      ownerName: owner.getName(),
    });

    res.status(201).json(serializeTrip(trip));
  });

  const listMyTrips = asyncHandler(async (req, res) => {
    const trips = await deps.tripRepository.findByParticipant(req.userId as string);
    res.status(200).json(trips.map(serializeTrip));
  });

  const getTrip = asyncHandler(async (req, res) => {
    const trip = await deps.tripRepository.findById(TripId.create(req.params['id']!));

    if (!trip || !trip.getParticipants().some((p) => p.userId === req.userId)) {
      res.status(404).json({ error: 'Trip not found.' });
      return;
    }

    res.status(200).json(serializeTrip(trip));
  });

  const updateTrip = asyncHandler(async (req, res) => {
    const parsed = updateTripSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const dateRange =
      parsed.data.startDate && parsed.data.endDate
        ? DateRange.create(new Date(parsed.data.startDate), new Date(parsed.data.endDate))
        : undefined;

    const useCase = new UpdateTripUseCase(deps.tripRepository);
    const trip = await useCase.execute({
      tripId: req.params['id']!,
      requesterId: req.userId as string,
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(dateRange ? { dateRange } : {}),
    });

    res.status(200).json(serializeTrip(trip));
  });

  const deleteTrip = asyncHandler(async (req, res) => {
    const useCase = new DeleteTripUseCase(deps.tripRepository);
    await useCase.execute({
      tripId: req.params['id']!,
      requesterId: req.userId as string,
    });

    res.status(204).send();
  });

  const addParticipant = asyncHandler(async (req, res) => {
    const parsed = addParticipantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const useCase = new AddParticipantToTripUseCase(deps.tripRepository, deps.userRepository);
    const trip = await useCase.execute({
      tripId: req.params['id']!,
      requesterId: req.userId as string,
      participantEmail: parsed.data.email,
    });

    res.status(201).json(serializeTrip(trip));
  });

  const removeParticipant = asyncHandler(async (req, res) => {
    const useCase = new RemoveParticipantFromTripUseCase(deps.tripRepository);
    const trip = await useCase.execute({
      tripId: req.params['id']!,
      requesterId: req.userId as string,
      participantUserId: req.params['userId']!,
    });

    res.status(200).json(serializeTrip(trip));
  });

  return {
    createTrip,
    listMyTrips,
    getTrip,
    updateTrip,
    deleteTrip,
    addParticipant,
    removeParticipant,
  };
}
