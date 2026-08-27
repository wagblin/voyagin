import { useQuery } from '@powersync/react';
import { mapPowerSyncRowsToTrips, type ParticipantRow, type TripRow } from '../lib/tripsPowerSyncMapping';
import type { Trip } from '../lib/tripsApi';

export interface OfflineTripsResult {
  trips: Trip[];
  isLoading: boolean;
}

export function useOfflineTrips(): OfflineTripsResult {
  const tripsQuery = useQuery<TripRow>('SELECT * FROM trips ORDER BY name');
  const participantsQuery = useQuery<ParticipantRow>('SELECT * FROM participants');

  return {
    trips: mapPowerSyncRowsToTrips(tripsQuery.data ?? [], participantsQuery.data ?? []),
    isLoading: tripsQuery.isLoading || participantsQuery.isLoading,
  };
}
