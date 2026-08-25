export function isValidTripDateRange(start: Date, end: Date): boolean {
  return end.getTime() >= start.getTime();
}
