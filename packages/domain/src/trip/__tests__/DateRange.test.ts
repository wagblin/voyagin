import { DateRange } from '../DateRange';
import { InvalidDateRangeError } from '../errors';

describe('DateRange', () => {
  it('creates a range when the end date is after the start date', () => {
    const range = DateRange.create(new Date('2026-09-01'), new Date('2026-09-15'));
    expect(range.start).toEqual(new Date('2026-09-01'));
    expect(range.end).toEqual(new Date('2026-09-15'));
  });

  it('allows the end date to equal the start date (single day trip)', () => {
    const day = new Date('2026-09-01');
    const range = DateRange.create(day, day);
    expect(range.start).toEqual(day);
  });

  it('rejects an end date before the start date', () => {
    expect(() => DateRange.create(new Date('2026-09-15'), new Date('2026-09-01'))).toThrow(
      InvalidDateRangeError,
    );
  });

  it('reports whether a date falls within the range', () => {
    const range = DateRange.create(new Date('2026-09-01'), new Date('2026-09-15'));
    expect(range.includes(new Date('2026-09-10'))).toBe(true);
    expect(range.includes(new Date('2026-10-01'))).toBe(false);
  });
});
