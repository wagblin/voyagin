import { Request, Response } from 'express';
import { z } from 'zod';
import { CreateTripUseCase, TripRepository } from '@voyagin/domain';

const createTripSchema = z.object({
  name: z.string().trim().min(1, 'Trip name must not be empty.'),
  ownerId: z.string().min(1),
  ownerName: z.string().min(1),
});

export function createTripHandler(tripRepository: TripRepository) {
  const createTrip = new CreateTripUseCase(tripRepository);

  return async (req: Request, res: Response): Promise<void> => {
    const parsed = createTripSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const trip = await createTrip.execute(parsed.data);

    res.status(201).json({
      id: trip.id.toString(),
      name: trip.getName(),
      dateRange: trip.getDateRange(),
      participants: trip.getParticipants().map((participant) => ({
        userId: participant.userId,
        name: participant.name,
        role: participant.role,
      })),
    });
  };
}
