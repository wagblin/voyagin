import express, { Express } from 'express';
import cors from 'cors';
import { TripRepository } from '@voyagin/domain';
import { buildTripRoutes } from '../adapters/http/tripRoutes';
import { buildHealthRoutes } from '../adapters/http/healthRoutes';

export interface AppDependencies {
  tripRepository: TripRepository;
}

export function buildApp(deps: AppDependencies): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', buildHealthRoutes());
  app.use('/api', buildTripRoutes(deps.tripRepository));
  return app;
}
