import { TripId } from './TripId';
import { DateRange } from './DateRange';
import { Participant } from './Participant';
import {
  InvalidTripNameError,
  DuplicateParticipantError,
  NotTripOwnerError,
  ParticipantNotFoundError,
  CannotRemoveOwnerError,
} from './errors';

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
  private participants: Participant[];

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

  addParticipant(participant: Participant, requesterId: string): void {
    this.assertOwnedBy(requesterId);
    if (this.participants.some((existing) => existing.userId === participant.userId)) {
      throw new DuplicateParticipantError(participant.userId);
    }
    this.participants.push(participant);
  }

  removeParticipant(userId: string, requesterId: string): void {
    this.assertOwnedBy(requesterId);

    const participant = this.participants.find((existing) => existing.userId === userId);
    if (!participant) {
      throw new ParticipantNotFoundError(userId);
    }
    if (participant.isOwner()) {
      throw new CannotRemoveOwnerError(userId);
    }

    this.participants = this.participants.filter((existing) => existing.userId !== userId);
  }

  adjustDateRange(dateRange: DateRange | undefined, requesterId: string): void {
    this.assertOwnedBy(requesterId);
    this.dateRange = dateRange;
  }

  rename(newName: string, requesterId: string): void {
    this.assertOwnedBy(requesterId);
    const trimmedName = newName.trim();
    if (trimmedName.length === 0) {
      throw new InvalidTripNameError();
    }
    this.name = trimmedName;
  }

  isOwnedBy(userId: string): boolean {
    return this.participants.some((participant) => participant.isOwner() && participant.userId === userId);
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

  private assertOwnedBy(requesterId: string): void {
    if (!this.isOwnedBy(requesterId)) {
      throw new NotTripOwnerError(requesterId);
    }
  }
}
