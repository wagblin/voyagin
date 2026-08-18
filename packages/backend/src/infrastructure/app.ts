import express, { Express } from 'express';
import { TripRepository } from '@voyagin/domain';
import { buildTripRoutes } from '../adapters/http/tripRoutes';

export interface AppDependencies {
  tripRepository: TripRepository;
}

export function buildApp(deps: AppDependencies): Express {
  const app = express();
  app.use(express.json());
  app.use('/api', buildTripRoutes(deps.tripRepository));
  return app;
}
