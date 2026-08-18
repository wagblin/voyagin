import { Trip } from '../Trip';
import { Participant } from '../Participant';
import { DateRange } from '../DateRange';
import {
  InvalidTripNameError,
  DuplicateParticipantError,
  NotTripOwnerError,
} from '../errors';

describe('Trip', () => {
  const baseProps = { name: 'Bali sabbatical', ownerId: 'user-1', ownerName: 'Alex' };

  describe('create', () => {
    it('creates a trip with the owner as its first participant', () => {
      const trip = Trip.create(baseProps);
      expect(trip.getName()).toBe('Bali sabbatical');
      expect(trip.getParticipants()).toHaveLength(1);
      expect(trip.getParticipants()[0]?.isOwner()).toBe(true);
    });

    it('allows creating a trip without fixed dates, to support improvisation', () => {
      const trip = Trip.create(baseProps);
      expect(trip.getDateRange()).toBeUndefined();
    });

    it('accepts an initial date range when provided', () => {
      const dateRange = DateRange.create(new Date('2026-09-01'), new Date('2026-09-15'));
      const trip = Trip.create({ ...baseProps, dateRange });
      expect(trip.getDateRange()).toBe(dateRange);
    });

    it('rejects an empty trip name', () => {
      expect(() => Trip.create({ ...baseProps, name: '   ' })).toThrow(InvalidTripNameError);
    });

    it('trims surrounding whitespace from the trip name', () => {
      const trip = Trip.create({ ...baseProps, name: '  Bali sabbatical  ' });
      expect(trip.getName()).toBe('Bali sabbatical');
    });
  });

  describe('addParticipant', () => {
    it('adds a new participant to the trip', () => {
      const trip = Trip.create(baseProps);
      trip.addParticipant(Participant.create('user-2', 'Sam'));
      expect(trip.getParticipants()).toHaveLength(2);
    });

    it('rejects a participant who already joined the trip', () => {
      const trip = Trip.create(baseProps);
      trip.addParticipant(Participant.create('user-2', 'Sam'));
      expect(() => trip.addParticipant(Participant.create('user-2', 'Sam'))).toThrow(
        DuplicateParticipantError,
      );
    });
  });

  describe('reconstitute', () => {
    it('rebuilds a trip from previously persisted data without re-validating invariants', () => {
      const dateRange = DateRange.create(new Date('2026-09-01'), new Date('2026-09-15'));
      const trip = Trip.reconstitute({
        id: 'trip-123',
        name: 'Bali sabbatical',
        participants: [
          { userId: 'user-1', name: 'Alex', role: 'owner' },
          { userId: 'user-2', name: 'Sam', role: 'member' },
        ],
        dateRange,
      });

      expect(trip.id.toString()).toBe('trip-123');
      expect(trip.getName()).toBe('Bali sabbatical');
      expect(trip.getParticipants()).toHaveLength(2);
      expect(trip.getDateRange()).toBe(dateRange);
    });

    it('rebuilds a trip that has no fixed dates yet', () => {
      const trip = Trip.reconstitute({
        id: 'trip-123',
        name: 'Bali sabbatical',
        participants: [{ userId: 'user-1', name: 'Alex', role: 'owner' }],
      });

      expect(trip.getDateRange()).toBeUndefined();
    });
  });

  describe('adjustDateRange', () => {
    it('lets the owner set dates once the trip is underway', () => {
      const trip = Trip.create(baseProps);
      const dateRange = DateRange.create(new Date('2026-09-01'), new Date('2026-09-15'));
      trip.adjustDateRange(dateRange, baseProps.ownerId);
      expect(trip.getDateRange()).toBe(dateRange);
    });

    it('lets the owner clear fixed dates to keep improvising', () => {
      const dateRange = DateRange.create(new Date('2026-09-01'), new Date('2026-09-15'));
      const trip = Trip.create({ ...baseProps, dateRange });
      trip.adjustDateRange(undefined, baseProps.ownerId);
      expect(trip.getDateRange()).toBeUndefined();
    });

    it('rejects a date change requested by someone who is not the owner', () => {
      const trip = Trip.create(baseProps);
      trip.addParticipant(Participant.create('user-2', 'Sam'));
      const dateRange = DateRange.create(new Date('2026-09-01'), new Date('2026-09-15'));

      expect(() => trip.adjustDateRange(dateRange, 'user-2')).toThrow(NotTripOwnerError);
      expect(trip.getDateRange()).toBeUndefined();
    });
  });

  describe('rename', () => {
    it('lets the owner rename the trip', () => {
      const trip = Trip.create(baseProps);
      trip.rename('Bali honeymoon', baseProps.ownerId);
      expect(trip.getName()).toBe('Bali honeymoon');
    });

    it('rejects an empty new name', () => {
      const trip = Trip.create(baseProps);
      expect(() => trip.rename('   ', baseProps.ownerId)).toThrow(InvalidTripNameError);
    });

    it('rejects a rename requested by someone who is not the owner', () => {
      const trip = Trip.create(baseProps);
      trip.addParticipant(Participant.create('user-2', 'Sam'));

      expect(() => trip.rename('Bali honeymoon', 'user-2')).toThrow(NotTripOwnerError);
      expect(trip.getName()).toBe('Bali sabbatical');
    });
  });

  describe('isOwnedBy', () => {
    it('returns true for the trip owner', () => {
      const trip = Trip.create(baseProps);
      expect(trip.isOwnedBy(baseProps.ownerId)).toBe(true);
    });

    it('returns false for a participant who is not the owner', () => {
      const trip = Trip.create(baseProps);
      trip.addParticipant(Participant.create('user-2', 'Sam'));
      expect(trip.isOwnedBy('user-2')).toBe(false);
    });

    it('returns false for someone who has not joined the trip', () => {
      const trip = Trip.create(baseProps);
      expect(trip.isOwnedBy('stranger')).toBe(false);
    });
  });
});
