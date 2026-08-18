export type ParticipantRole = 'owner' | 'member';

export class Participant {
  private constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly role: ParticipantRole,
  ) {}

  static create(userId: string, name: string, role: ParticipantRole = 'member'): Participant {
    return new Participant(userId, name, role);
  }

  isOwner(): boolean {
    return this.role === 'owner';
  }
}
