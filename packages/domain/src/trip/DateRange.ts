import { InvalidDateRangeError } from './errors';

export class DateRange {
  private constructor(
    public readonly start: Date,
    public readonly end: Date,
  ) {}

  static create(start: Date, end: Date): DateRange {
    if (end.getTime() < start.getTime()) {
      throw new InvalidDateRangeError(start, end);
    }
    return new DateRange(start, end);
  }

  includes(date: Date): boolean {
    return date.getTime() >= this.start.getTime() && date.getTime() <= this.end.getTime();
  }
}
