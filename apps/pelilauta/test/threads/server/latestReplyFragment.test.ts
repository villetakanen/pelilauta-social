/**
 * Unit tests for `latestReplyFragment`, the target the latest-reply control
 * in `ThreadInfoSection.astro` links to: the final reply's fragment, or the
 * discussion heading (`DiscussionSection.svelte`'s `#discussion`) when the
 * thread carries no replies yet.
 */

import { describe, expect, it, vi } from 'vitest';
import type { Reply } from '../../../src/schemas/ReplySchema';

// `prepareDiscussion.ts` also imports `fetchDiscussion`, which reaches the
// real Firebase server app on import. This test exercises only the pure
// `latestReplyFragment` helper, so those modules are mocked the same way
// `prepareDiscussion.test.ts` mocks them.
vi.mock('../../../src/firebase/server/discussion/fetchDiscussion', () => ({
  fetchDiscussion: vi.fn(),
}));
vi.mock('../../../src/firebase/server/profiles', () => ({
  getPublicProfiles: vi.fn(),
}));
vi.mock('../../../src/utils/marked', () => ({
  markdownToHTML: vi.fn(),
}));

import {
  latestReplyFragment,
  type PreparedDiscussion,
} from '../../../src/threads/server/prepareDiscussion';

function reply(key: string): Reply {
  return {
    key,
    threadKey: 'thread-1',
    owners: ['uid-a'],
    flowTime: 0,
    markdownContent: 'body',
  } as Reply;
}

describe('latestReplyFragment', () => {
  it('targets the discussion heading when the thread has no replies', () => {
    const discussion: PreparedDiscussion = { replies: [], incomplete: false };

    expect(latestReplyFragment(discussion)).toBe('#discussion');
  });

  it('targets the final reply in the prepared order', () => {
    const discussion: PreparedDiscussion = {
      replies: [
        { reply: reply('r1') },
        { reply: reply('r2') },
        { reply: reply('r3') },
      ],
      incomplete: false,
    };

    expect(latestReplyFragment(discussion)).toBe('#r3');
  });
});
