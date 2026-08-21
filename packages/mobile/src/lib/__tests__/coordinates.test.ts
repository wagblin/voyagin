import { parseLatLngInput } from '../coordinates';

describe('parseLatLngInput', () => {
  it('parses valid latitude/longitude strings into numbers', () => {
    expect(parseLatLngInput('48.8566', '2.3522')).toEqual({ latitude: 48.8566, longitude: 2.3522 });
  });

  it('parses negative coordinates', () => {
    expect(parseLatLngInput('-33.8688', '-70.9060')).toEqual({ latitude: -33.8688, longitude: -70.906 });
  });

  it('returns null when latitude is empty', () => {
    expect(parseLatLngInput('', '2.3522')).toBeNull();
  });

  it('returns null when longitude is empty', () => {
    expect(parseLatLngInput('48.8566', '')).toBeNull();
  });

  it('returns null when latitude is whitespace-only', () => {
    expect(parseLatLngInput('   ', '2.3522')).toBeNull();
  });

  it('returns null when longitude is whitespace-only', () => {
    expect(parseLatLngInput('48.8566', '   ')).toBeNull();
  });

  it('returns null when latitude is not a valid number', () => {
    expect(parseLatLngInput('abc', '2.3522')).toBeNull();
  });

  it('returns null when longitude is not a valid number', () => {
    expect(parseLatLngInput('48.8566', 'xyz')).toBeNull();
  });
});
