export type TripDateRangeResult =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'valid'; startDate: string; endDate: string }

export function parseTripDateRangeInput(startInput: string, endInput: string): TripDateRangeResult {
  if (startInput === '' && endInput === '') {
    return { kind: 'empty' }
  }

  if (startInput === '' || endInput === '') {
    return { kind: 'invalid' }
  }

  const startDate = new Date(`${startInput}T00:00:00.000Z`)
  const endDate = new Date(`${endInput}T00:00:00.000Z`)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { kind: 'invalid' }
  }

  if (endDate.getTime() < startDate.getTime()) {
    return { kind: 'invalid' }
  }

  return {
    kind: 'valid',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}
