import { TripId } from './TripId';
import { DateRange } from './DateRange';
import { Participant } from './Participant';
import { InvalidTripNameError, DuplicateParticipantError } from './errors';

export interface CreateTripProps {
  name: string;
  ownerId: string;
  ownerName: string;
  dateRange?: DateRange;
}

export interface ReconstituteTripProps {
  id: string;
  name: string;
  participants: Array<{ userId: string; name: string; role: 'owner' | 'member' }>;
  dateRange?: DateRange;
}

export class Trip {
  private readonly participants: Participant[];

  private constructor(
    public readonly id: TripId,
    private name: string,
    participants: Participant[],
    private dateRange: DateRange | undefined,
  ) {
    this.participants = participants;
  }

  static create(props: CreateTripProps): Trip {
    const trimmedName = props.name.trim();
    if (trimmedName.length === 0) {
      throw new InvalidTripNameError();
    }
    const owner = Participant.create(props.ownerId, props.ownerName, 'owner');
    return new Trip(TripId.generate(), trimmedName, [owner], props.dateRange);
  }

  static reconstitute(props: ReconstituteTripProps): Trip {
    const participants = props.participants.map((p) =>
      Participant.create(p.userId, p.name, p.role),
    );
    return new Trip(TripId.create(props.id), props.name, participants, props.dateRange);
  }

  addParticipant(participant: Participant): void {
    if (this.participants.some((existing) => existing.userId === participant.userId)) {
      throw new DuplicateParticipantError(participant.userId);
    }
    this.participants.push(participant);
  }

  adjustDateRange(dateRange: DateRange | undefined): void {
    this.dateRange = dateRange;
  }

  getName(): string {
    return this.name;
  }

  getParticipants(): readonly Participant[] {
    return this.participants;
  }

  getDateRange(): DateRange | undefined {
    return this.dateRange;
  }
}
