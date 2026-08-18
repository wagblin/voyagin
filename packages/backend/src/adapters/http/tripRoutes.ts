import { Router } from 'express';
import { TripRepository } from '@voyagin/domain';
import { createTripHandler } from './tripController';

export function buildTripRoutes(tripRepository: TripRepository): Router {
  const router = Router();
  router.post('/trips', createTripHandler(tripRepository));
  return router;
}
