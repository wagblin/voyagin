import { column, Schema, Table } from '@powersync/react-native';

const trips = new Table({
  name: column.text,
  startDate: column.text,
  endDate: column.text,
  createdAt: column.text,
  updatedAt: column.text,
});

const participants = new Table(
  { userId: column.text, name: column.text, role: column.text, tripId: column.text },
  { indexes: { trip: ['tripId'] } },
);

export const AppSchema = new Schema({ trips, participants });
export type Database = (typeof AppSchema)['types'];
