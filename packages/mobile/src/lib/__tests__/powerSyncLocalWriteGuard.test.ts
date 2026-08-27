import { describeUnexpectedLocalWrite } from '../powerSyncLocalWriteGuard';

describe('describeUnexpectedLocalWrite', () => {
  it('names the table, the operation and the record id in the message', () => {
    const message = describeUnexpectedLocalWrite({ op: 'PATCH', table: 'trips', id: 'trip-1' });

    expect(message).toContain('trips');
    expect(message).toContain('PATCH');
    expect(message).toContain('trip-1');
  });

  it('explains that this slice is read-only and writes must go through the REST API', () => {
    const message = describeUnexpectedLocalWrite({ op: 'PUT', table: 'participants', id: 'participant-1' });

    expect(message).toMatch(/read-only|read only/i);
  });

  it('produces a distinct message per operation type', () => {
    const put = describeUnexpectedLocalWrite({ op: 'PUT', table: 'trips', id: 'trip-1' });
    const patch = describeUnexpectedLocalWrite({ op: 'PATCH', table: 'trips', id: 'trip-1' });
    const del = describeUnexpectedLocalWrite({ op: 'DELETE', table: 'trips', id: 'trip-1' });

    expect(new Set([put, patch, del]).size).toBe(3);
  });
});
