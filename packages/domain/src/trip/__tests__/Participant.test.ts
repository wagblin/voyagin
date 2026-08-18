import { Participant } from '../Participant';

describe('Participant', () => {
  it('defaults to the member role', () => {
    const participant = Participant.create('user-1', 'Alex');
    expect(participant.role).toBe('member');
    expect(participant.isOwner()).toBe(false);
  });

  it('can be created as the owner', () => {
    const participant = Participant.create('user-1', 'Alex', 'owner');
    expect(participant.isOwner()).toBe(true);
  });
});
