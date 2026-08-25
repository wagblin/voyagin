process.env.TZ = 'America/New_York';

import { toUtcDateOnlyIso } from '../dateOnlyIso';

describe('toUtcDateOnlyIso', () => {
  it('preserves the calendar day picked on the device regardless of its time zone', () => {
    const pickedLocalDate = new Date(2026, 7, 18); // August 18th, local midnight in America/New_York

    expect(toUtcDateOnlyIso(pickedLocalDate)).toBe('2026-08-18T00:00:00.000Z');
  });

  it('works across a month boundary', () => {
    const pickedLocalDate = new Date(2026, 7, 31);

    expect(toUtcDateOnlyIso(pickedLocalDate)).toBe('2026-08-31T00:00:00.000Z');
  });

  it('works across a year boundary', () => {
    const pickedLocalDate = new Date(2026, 11, 31);

    expect(toUtcDateOnlyIso(pickedLocalDate)).toBe('2026-12-31T00:00:00.000Z');
  });
});
