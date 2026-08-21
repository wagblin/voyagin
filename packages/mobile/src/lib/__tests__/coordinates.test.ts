import { parseLatLngInput } from '../coordinates';

describe('parseLatLngInput', () => {
  it('reports no location when both fields are empty', () => {
    expect(parseLatLngInput('', '')).toEqual({ kind: 'none' });
  });

  it('reports no location when both fields are whitespace-only', () => {
    expect(parseLatLngInput('   ', '   ')).toEqual({ kind: 'none' });
  });

  it('parses valid latitude/longitude strings into numbers', () => {
    expect(parseLatLngInput('48.8566', '2.3522')).toEqual({
      kind: 'valid',
      latitude: 48.8566,
      longitude: 2.3522,
    });
  });

  it('parses negative coordinates', () => {
    expect(parseLatLngInput('-33.8688', '-70.9060')).toEqual({
      kind: 'valid',
      latitude: -33.8688,
      longitude: -70.906,
    });
  });

  it('reports an invalid input when latitude is empty but longitude is filled', () => {
    expect(parseLatLngInput('', '2.3522')).toEqual({ kind: 'invalid' });
  });

  it('reports an invalid input when longitude is empty but latitude is filled', () => {
    expect(parseLatLngInput('48.8566', '')).toEqual({ kind: 'invalid' });
  });

  it('reports an invalid input when latitude is not a valid number', () => {
    expect(parseLatLngInput('abc', '2.3522')).toEqual({ kind: 'invalid' });
  });

  it('reports an invalid input when longitude is not a valid number', () => {
    expect(parseLatLngInput('48.8566', 'xyz')).toEqual({ kind: 'invalid' });
  });

  it('reports an invalid input when latitude is whitespace-only but longitude is filled', () => {
    expect(parseLatLngInput('   ', '2.3522')).toEqual({ kind: 'invalid' });
  });
});
