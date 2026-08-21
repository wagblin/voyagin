export type TakenAtInputResult =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'valid'; date: Date }

export function parseTakenAtInput(input: string): TakenAtInputResult {
  const trimmed = input.trim()

  if (trimmed === '') {
    return { kind: 'empty' }
  }

  const date = new Date(trimmed)

  if (Number.isNaN(date.getTime())) {
    return { kind: 'invalid' }
  }

  return { kind: 'valid', date }
}
