import { mapPowerSyncRowsToTrips, type ParticipantRow, type TripRow } from '../tripsPowerSyncMapping';

function tripRow(overrides: Partial<TripRow> = {}): TripRow {
  return {
    id: 'trip-1',
    name: 'Roadtrip',
    startDate: null,
    endDate: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function participantRow(overrides: Partial<ParticipantRow> = {}): ParticipantRow {
  return {
    id: 'participant-1',
    userId: 'user-1',
    name: 'Alice',
    role: 'owner',
    tripId: 'trip-1',
    ...overrides,
  };
}

describe('mapPowerSyncRowsToTrips', () => {
  it('returns an empty array when there are no local trip rows', () => {
    expect(mapPowerSyncRowsToTrips([], [])).toEqual([]);
  });

  it('maps a trip row without dates and without participants', () => {
    const result = mapPowerSyncRowsToTrips([tripRow()], []);

    expect(result).toEqual([{ id: 'trip-1', name: 'Roadtrip', dateRange: null, participants: [] }]);
  });

  it('attaches only the participants belonging to that trip', () => {
    const rows = [
      participantRow({ id: 'p-1', userId: 'user-1', name: 'Alice', role: 'owner', tripId: 'trip-1' }),
      participantRow({ id: 'p-2', userId: 'user-2', name: 'Bob', role: 'member', tripId: 'trip-1' }),
      participantRow({ id: 'p-3', userId: 'user-3', name: 'Carol', role: 'owner', tripId: 'trip-2' }),
    ];

    const result = mapPowerSyncRowsToTrips([tripRow({ id: 'trip-1' })], rows);

    expect(result).toEqual([
      {
        id: 'trip-1',
        name: 'Roadtrip',
        dateRange: null,
        participants: [
          { userId: 'user-1', name: 'Alice', role: 'owner' },
          { userId: 'user-2', name: 'Bob', role: 'member' },
        ],
      },
    ]);
  });

  it('builds a dateRange when both startDate and endDate are set', () => {
    const result = mapPowerSyncRowsToTrips(
      [tripRow({ startDate: '2026-08-18T00:00:00.000Z', endDate: '2026-08-25T00:00:00.000Z' })],
      [],
    );

    expect(result[0]?.dateRange).toEqual({ start: '2026-08-18T00:00:00.000Z', end: '2026-08-25T00:00:00.000Z' });
  });

  it('treats a dateRange as absent when only startDate is set', () => {
    const result = mapPowerSyncRowsToTrips([tripRow({ startDate: '2026-08-18T00:00:00.000Z', endDate: null })], []);

    expect(result[0]?.dateRange).toBeNull();
  });

  it('treats a dateRange as absent when only endDate is set', () => {
    const result = mapPowerSyncRowsToTrips([tripRow({ startDate: null, endDate: '2026-08-25T00:00:00.000Z' })], []);

    expect(result[0]?.dateRange).toBeNull();
  });

  it('maps several trip rows in the order they were given', () => {
    const rows = [tripRow({ id: 'trip-1', name: 'Roadtrip' }), tripRow({ id: 'trip-2', name: 'City break' })];

    const result = mapPowerSyncRowsToTrips(rows, []);

    expect(result.map((trip) => trip.id)).toEqual(['trip-1', 'trip-2']);
    expect(result.map((trip) => trip.name)).toEqual(['Roadtrip', 'City break']);
  });
});
