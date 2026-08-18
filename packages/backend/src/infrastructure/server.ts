import { buildApp } from './app';
import { prismaClient } from './prismaClient';
import { PrismaTripRepository } from '../adapters/persistence/PrismaTripRepository';

const port = process.env['PORT'] ?? 3000;

const app = buildApp({
  tripRepository: new PrismaTripRepository(prismaClient),
});

app.listen(port, () => {
  console.log(`VoyagIn API listening on port ${port}`);
});
