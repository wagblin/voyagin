import { parseTakenAtInput } from '../dateInput';

describe('parseTakenAtInput', () => {
  it('returns "empty" when the field is empty', () => {
    expect(parseTakenAtInput('')).toEqual({ kind: 'empty' });
  });

  it('returns "empty" when the field is whitespace-only', () => {
    expect(parseTakenAtInput('   ')).toEqual({ kind: 'empty' });
  });

  it('returns "valid" with the parsed date for a valid ISO-like datetime string', () => {
    const result = parseTakenAtInput('2024-03-15T14:23:00');

    expect(result.kind).toBe('valid');
    expect(result.kind === 'valid' && result.date).toEqual(new Date('2024-03-15T14:23:00'));
  });

  it('returns "invalid" for free text that is not a date', () => {
    expect(parseTakenAtInput('pas une date')).toEqual({ kind: 'invalid' });
  });
});
