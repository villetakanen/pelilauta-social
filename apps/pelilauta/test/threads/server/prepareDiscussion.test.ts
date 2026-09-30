/**
 * Unit tests for the thread page's reply preparation module.
 *
 * `prepareDiscussion` composes `fetchDiscussion` (the isolated-parse reader,
 * covered by its own test), `getPublicProfiles` (the batched attribution
 * reader) and `markdownToHTML` (the shared renderer) into what the initial
 * render needs. `fetchDiscussion`, `getPublicProfiles` and `markdownToHTML`
 * are mocked so this test exercises only the composition.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Reply } from '../../../src/schemas/ReplySchema';

const { mockFetchDiscussion, mockGetPublicProfiles, mockMarkdownToHTML } =
  vi.hoisted(() => ({
    mockFetchDiscussion: vi.fn(),
    mockGetPublicProfiles: vi.fn(),
    mockMarkdownToHTML: vi.fn(),
  }));

vi.mock('../../../src/firebase/server/discussion/fetchDiscussion', () => ({
  fetchDiscussion: mockFetchDiscussion,
}));
vi.mock('../../../src/firebase/server/profiles', () => ({
  getPublicProfiles: mockGetPublicProfiles,
}));
vi.mock('../../../src/utils/marked', () => ({
  markdownToHTML: mockMarkdownToHTML,
}));

import { prepareDiscussion } from '../../../src/threads/server/prepareDiscussion';

function reply(key: string, ownerUid: string, markdownContent: string): Reply {
  return {
    key,
    threadKey: 'thread-1',
    owners: [ownerUid],
    flowTime: 0,
    markdownContent,
  } as Reply;
}

describe('prepareDiscussion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkdownToHTML.mockImplementation(
      async (markdown: string) => `<p>${markdown}</p>`,
    );
  });

  it('returns an empty, complete discussion without resolving attribution', async () => {
    mockFetchDiscussion.mockResolvedValueOnce({
      replies: [],
      incomplete: false,
    });
    mockGetPublicProfiles.mockResolvedValueOnce({});

    const result = await prepareDiscussion('thread-1');

    expect(result).toEqual({ replies: [], incomplete: false });
    expect(mockGetPublicProfiles).toHaveBeenCalledWith([]);
  });

  it('resolves every author in one batched call and renders each body', async () => {
    mockFetchDiscussion.mockResolvedValueOnce({
      replies: [reply('r1', 'uid-a', 'Hello'), reply('r2', 'uid-b', 'World')],
      incomplete: false,
    });
    mockGetPublicProfiles.mockResolvedValueOnce({
      'uid-a': { key: 'uid-a', nick: 'Aino', username: 'aino' },
      'uid-b': { key: 'uid-b', nick: 'Bertil', username: 'bertil' },
    });

    const result = await prepareDiscussion('thread-1');

    expect(mockGetPublicProfiles).toHaveBeenCalledTimes(1);
    expect(mockGetPublicProfiles).toHaveBeenCalledWith(['uid-a', 'uid-b']);
    expect(result.incomplete).toBe(false);
    expect(result.replies).toEqual([
      {
        reply: reply('r1', 'uid-a', 'Hello'),
        bodyHtml: '<p>Hello</p>',
        author: { key: 'uid-a', nick: 'Aino', username: 'aino' },
      },
      {
        reply: reply('r2', 'uid-b', 'World'),
        bodyHtml: '<p>World</p>',
        author: { key: 'uid-b', nick: 'Bertil', username: 'bertil' },
      },
    ]);
  });

  it('carries incomplete through from fetchDiscussion', async () => {
    mockFetchDiscussion.mockResolvedValueOnce({
      replies: [reply('r1', 'uid-a', 'Hello')],
      incomplete: true,
    });
    mockGetPublicProfiles.mockResolvedValueOnce({
      'uid-a': { key: 'uid-a', nick: 'Aino', username: 'aino' },
    });

    const result = await prepareDiscussion('thread-1');

    expect(result.incomplete).toBe(true);
  });

  it('leaves author undefined for a reply whose author does not resolve', async () => {
    mockFetchDiscussion.mockResolvedValueOnce({
      replies: [reply('r1', 'uid-missing', 'Hello')],
      incomplete: false,
    });
    mockGetPublicProfiles.mockResolvedValueOnce({});

    const result = await prepareDiscussion('thread-1');

    expect(result.replies[0].author).toBeUndefined();
    expect(result.replies[0].bodyHtml).toBe('<p>Hello</p>');
  });
});
