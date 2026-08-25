import { parseTripDateRangeInput } from '../tripDateRange';

describe('parseTripDateRangeInput', () => {
  it('returns "empty" when both fields are empty', () => {
    expect(parseTripDateRangeInput('', '')).toEqual({ kind: 'empty' });
  });

  it('returns "invalid" when only the start date is filled', () => {
    expect(parseTripDateRangeInput('2026-08-18', '')).toEqual({ kind: 'invalid' });
  });

  it('returns "invalid" when only the end date is filled', () => {
    expect(parseTripDateRangeInput('', '2026-08-25')).toEqual({ kind: 'invalid' });
  });

  it('returns "valid" with full ISO datetimes when both dates are filled and end is after start', () => {
    expect(parseTripDateRangeInput('2026-08-18', '2026-08-25')).toEqual({
      kind: 'valid',
      startDate: '2026-08-18T00:00:00.000Z',
      endDate: '2026-08-25T00:00:00.000Z',
    });
  });

  it('returns "valid" when start and end are the same day', () => {
    expect(parseTripDateRangeInput('2026-08-18', '2026-08-18')).toEqual({
      kind: 'valid',
      startDate: '2026-08-18T00:00:00.000Z',
      endDate: '2026-08-18T00:00:00.000Z',
    });
  });

  it('returns "invalid" when the end date is before the start date', () => {
    expect(parseTripDateRangeInput('2026-08-25', '2026-08-18')).toEqual({ kind: 'invalid' });
  });

  it('returns "invalid" when a date is not a recognizable date', () => {
    expect(parseTripDateRangeInput('pas une date', '2026-08-25')).toEqual({ kind: 'invalid' });
  });
});
