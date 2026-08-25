import { isValidTripDateRange } from '../tripDateRangeValidity';

describe('isValidTripDateRange', () => {
  it('accepts a range where the end date is after the start date', () => {
    expect(isValidTripDateRange(new Date('2026-08-18'), new Date('2026-08-25'))).toBe(true);
  });

  it('accepts a range where start and end fall on the same day', () => {
    expect(isValidTripDateRange(new Date('2026-08-18'), new Date('2026-08-18'))).toBe(true);
  });

  it('rejects a range where the end date is before the start date', () => {
    expect(isValidTripDateRange(new Date('2026-08-25'), new Date('2026-08-18'))).toBe(false);
  });
});
