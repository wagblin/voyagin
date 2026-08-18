import express, { Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { PasswordHasher, TripRepository, UserRepository } from '@voyagin/domain';
import { buildTripRoutes } from '../adapters/http/tripRoutes';
import { buildHealthRoutes } from '../adapters/http/healthRoutes';
import { buildAuthRoutes } from '../adapters/http/authRoutes';
import { buildUserRoutes } from '../adapters/http/userRoutes';
import { errorHandler } from '../adapters/http/errorHandler';
import { JwtTokenService } from '../adapters/security/JwtTokenService';
import { TokenBlocklist } from '../adapters/security/TokenBlocklist';
import { swaggerSpec } from './swagger';

export interface AppDependencies {
  tripRepository: TripRepository;
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  tokenService: JwtTokenService;
  tokenBlocklist: TokenBlocklist;
}

export function buildApp(deps: AppDependencies): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api', buildHealthRoutes());
  app.use('/api', buildAuthRoutes(deps));
  app.use('/api', buildUserRoutes(deps));
  app.use('/api', buildTripRoutes(deps));
  app.use(errorHandler);
  return app;
}
