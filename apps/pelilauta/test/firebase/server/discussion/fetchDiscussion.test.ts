import { fetchDiscussion } from 'src/firebase/server/discussion/fetchDiscussion';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, orderBy } = vi.hoisted(() => ({
  get: vi.fn(),
  orderBy: vi.fn(),
}));

vi.mock('src/firebase/server', () => {
  const query = { orderBy, get };
  orderBy.mockReturnValue(query);
  const collection = { orderBy };
  const doc = { collection: () => collection };
  return { serverDB: { collection: () => ({ doc: () => doc }) } };
});

vi.mock('src/utils/logHelpers', () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));

function record(id: string, data: Record<string, unknown>) {
  return { id, data: () => data };
}

const valid = (n: number) => ({
  owners: ['author'],
  createdAt: new Date(2024, 0, 10 - n),
  markdownContent: `reply ${n}`,
});

describe('fetchDiscussion', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('queries replies ordered by createdAt ascending', async () => {
    get.mockResolvedValue({ docs: [] });
    await fetchDiscussion('thread');
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'asc');
  });

  it('returns replies in the order the snapshot gives them', async () => {
    // The later record comes first, so a re-sort by time would reverse these.
    get.mockResolvedValue({
      docs: [record('b', valid(1)), record('a', valid(5))],
    });
    const replies = await fetchDiscussion('thread');
    expect(replies.map((r) => r.key)).toEqual(['b', 'a']);
  });

  it('skips a record that fails parsing and returns the valid ones', async () => {
    get.mockResolvedValue({
      docs: [
        record('a', valid(3)),
        record('bad', { ...valid(2), owners: [] }),
        record('c', valid(1)),
      ],
    });
    const replies = await fetchDiscussion('thread');
    expect(replies.map((r) => r.key)).toEqual(['a', 'c']);
  });
});
