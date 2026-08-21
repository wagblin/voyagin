import { describe, expect, it } from 'vitest'
import { parseLatLngInput } from '../coordinates'

describe('parseLatLngInput', () => {
  it('returns "none" when both fields are empty', () => {
    expect(parseLatLngInput('', '')).toEqual({ kind: 'none' })
  })

  it('returns "none" when both fields are whitespace-only', () => {
    expect(parseLatLngInput('   ', '  ')).toEqual({ kind: 'none' })
  })

  it('returns "valid" with parsed numbers when both fields hold positive coordinates', () => {
    expect(parseLatLngInput('48.8566', '2.3522')).toEqual({
      kind: 'valid',
      latitude: 48.8566,
      longitude: 2.3522,
    })
  })

  it('returns "valid" with parsed numbers when both fields hold negative coordinates', () => {
    expect(parseLatLngInput('-33.8688', '-70.6693')).toEqual({
      kind: 'valid',
      latitude: -33.8688,
      longitude: -70.6693,
    })
  })

  it('returns "invalid" when latitude is empty but longitude is filled', () => {
    expect(parseLatLngInput('', '2.3522')).toEqual({ kind: 'invalid' })
  })

  it('returns "invalid" when longitude is empty but latitude is filled', () => {
    expect(parseLatLngInput('48.8566', '')).toEqual({ kind: 'invalid' })
  })

  it('returns "invalid" when latitude is not numeric', () => {
    expect(parseLatLngInput('not-a-number', '2.3522')).toEqual({ kind: 'invalid' })
  })

  it('returns "invalid" when longitude is not numeric', () => {
    expect(parseLatLngInput('48.8566', 'not-a-number')).toEqual({ kind: 'invalid' })
  })

  it('returns "invalid" when latitude is whitespace-only but longitude is filled', () => {
    expect(parseLatLngInput('   ', '2.3522')).toEqual({ kind: 'invalid' })
  })
})
