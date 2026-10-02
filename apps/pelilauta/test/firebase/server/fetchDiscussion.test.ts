/**
 * Unit tests for the discussion reader.
 *
 * `fetchDiscussion` parses each stored reply in isolation: a malformed
 * record is skipped rather than discarding every valid reply, and the read
 * reports `incomplete` when it skipped one. A failure of the collection read
 * itself reports `unavailable` instead of propagating, so the thread page
 * still renders its opening post. These tests mock `serverDB` so they never
 * touch a real Firestore instance.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockCollection } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockCollection = vi.fn(() => ({
    doc: () => ({ collection: () => ({ get: mockGet }) }),
  }));
  return { mockGet, mockCollection };
});

vi.mock('../../../src/firebase/server/index.ts', () => ({
  serverDB: {
    collection: mockCollection,
  },
}));

import { fetchDiscussion } from '../../../src/firebase/server/discussion/fetchDiscussion';

function docFor(id: string, data: Record<string, unknown>) {
  return { id, data: () => data };
}

const validReply = (id: string, flowTime: number) => ({
  markdownContent: `Reply ${id}`,
  owners: [`uid-${id}`],
  createdAt: new Date(flowTime),
  updatedAt: new Date(flowTime),
});

describe('fetchDiscussion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty, complete discussion without a Firestore call for an empty key', async () => {
    const result = await fetchDiscussion('');

    expect(result).toEqual({
      replies: [],
      incomplete: false,
      unavailable: false,
    });
    expect(mockCollection).not.toHaveBeenCalled();
  });

  it('returns every valid reply, sorted, when no record is malformed', async () => {
    mockGet.mockResolvedValueOnce({
      docs: [
        docFor('b', validReply('b', 200)),
        docFor('a', validReply('a', 100)),
      ],
    });

    const result = await fetchDiscussion('thread-1');

    expect(result.incomplete).toBe(false);
    expect(result.replies.map((r) => r.key)).toEqual(['a', 'b']);
  });

  it('skips a malformed record, keeps valid replies, and marks the read incomplete', async () => {
    mockGet.mockResolvedValueOnce({
      docs: [
        docFor('good', validReply('good', 100)),
        // Missing `owners`, which ReplySchema requires at least one of.
        docFor('bad', { markdownContent: 'no owner', owners: [] }),
      ],
    });

    const result = await fetchDiscussion('thread-1');

    expect(result.incomplete).toBe(true);
    expect(result.replies).toHaveLength(1);
    expect(result.replies[0].key).toBe('good');
  });

  it('reports the read unavailable, rather than throwing, when the collection read fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('Firestore is unreachable'));

    const result = await fetchDiscussion('thread-1');

    expect(result).toEqual({
      replies: [],
      incomplete: false,
      unavailable: true,
    });
  });
});
