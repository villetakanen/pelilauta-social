import { describe, expect, it, vi } from 'vitest';
import { parseSnapshotReplies } from '../../../src/threads/client/parseSnapshotReplies';

vi.mock('src/utils/logHelpers', () => ({ logError: vi.fn() }));

function doc(id: string, data: Record<string, unknown>) {
  return { id, data: () => data };
}

function reply(owner: string) {
  return { owners: [owner], markdownContent: 'text' };
}

describe('parseSnapshotReplies', () => {
  it('keeps the order of the snapshot', () => {
    const replies = parseSnapshotReplies(
      [doc('a', reply('u')), doc('b', reply('u')), doc('c', reply('u'))],
      'thread-1',
    );

    expect(replies.map((r) => r.key)).toEqual(['a', 'b', 'c']);
    expect(replies.every((r) => r.threadKey === 'thread-1')).toBe(true);
  });

  it('skips a malformed reply and keeps the others', () => {
    const replies = parseSnapshotReplies(
      [doc('a', reply('u')), doc('bad', { owners: [] }), doc('c', reply('u'))],
      'thread-1',
    );

    expect(replies.map((r) => r.key)).toEqual(['a', 'c']);
  });
});
