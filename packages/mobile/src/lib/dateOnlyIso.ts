export function toUtcDateOnlyIso(date: Date): string {
  const utcMidnight = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  return utcMidnight.toISOString();
}
