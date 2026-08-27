import { PowerSyncDatabase } from '@powersync/react-native';
import { AppSchema } from './schema';

export const powerSyncDatabase = new PowerSyncDatabase({
  schema: AppSchema,
  database: { dbFilename: 'voyagin.db' },
});
