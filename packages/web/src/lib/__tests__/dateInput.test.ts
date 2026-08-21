import { describe, expect, it } from 'vitest'
import { parseTakenAtInput } from '../dateInput'

describe('parseTakenAtInput', () => {
  it('returns "empty" when the field is empty', () => {
    expect(parseTakenAtInput('')).toEqual({ kind: 'empty' })
  })

  it('returns "empty" when the field is whitespace-only', () => {
    expect(parseTakenAtInput('   ')).toEqual({ kind: 'empty' })
  })

  it('returns "valid" with the parsed date for a valid datetime-local value', () => {
    const result = parseTakenAtInput('2024-03-15T14:23')

    expect(result.kind).toBe('valid')
    expect(result.kind === 'valid' && result.date).toEqual(new Date('2024-03-15T14:23'))
  })

  it('returns "invalid" for text that is not a date', () => {
    expect(parseTakenAtInput('pas une date')).toEqual({ kind: 'invalid' })
  })
})
