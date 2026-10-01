/**
 * Unit tests for the thread page's discovery metadata.
 *
 * The omission rules and the serialization are the two things the module
 * decides on its own; both are exercised here against plain records, with no
 * Firestore or renderer in play.
 */

import { describe, expect, it } from 'vitest';
import type { PublicProfile } from '../../../src/schemas/ProfileSchema';
import type { Reply } from '../../../src/schemas/ReplySchema';
import type { Thread } from '../../../src/schemas/ThreadSchema';
import {
  buildDiscussionGraph,
  serializeJsonLd,
} from '../../../src/threads/server/discussionMetadata';
import type { PreparedDiscussion } from '../../../src/threads/server/prepareDiscussion';

const ORIGIN = 'https://pelilauta.social';

const aino: PublicProfile = {
  key: 'uid-a',
  nick: 'Aino',
  username: 'aino',
};

function thread(overrides: Partial<Thread> = {}): Thread {
  return {
    key: 'thread-1',
    title: 'An opening post',
    channel: 'yleinen',
    owners: ['uid-a'],
    flowTime: 1_700_000_000_000,
    markdownContent: 'The opening body.',
    createdAt: new Date('2024-01-02T00:00:00.000Z'),
    ...overrides,
  } as Thread;
}

function reply(overrides: Partial<Reply> = {}): Reply {
  return {
    key: 'reply-1',
    threadKey: 'thread-1',
    owners: ['uid-a'],
    flowTime: 1,
    markdownContent: 'A reply body.',
    createdAt: new Date('2024-01-03T00:00:00.000Z'),
    ...overrides,
  } as Reply;
}

function discussion(
  replies: PreparedDiscussion['replies'],
): PreparedDiscussion {
  return { replies, incomplete: false };
}

describe('buildDiscussionGraph', () => {
  it('describes the opening post and every qualifying reply', () => {
    const graph = buildDiscussionGraph({
      thread: thread(),
      authorAttribution: aino,
      discussion: discussion([{ reply: reply(), author: aino }]),
      origin: ORIGIN,
    });

    expect(graph).not.toBeNull();
    expect(graph?.['@type']).toBe('DiscussionForumPosting');
    expect(graph?.url).toBe(`${ORIGIN}/threads/thread-1`);
    expect(graph?.headline).toBe('An opening post');
    expect(graph?.datePublished).toBe('2024-01-02T00:00:00.000Z');
    expect(graph?.author).toEqual({
      '@type': 'Person',
      name: 'Aino',
      url: `${ORIGIN}/profiles/uid-a`,
    });
    expect(graph?.comment).toEqual([
      {
        '@type': 'Comment',
        '@id': `${ORIGIN}/threads/thread-1#reply-1`,
        url: `${ORIGIN}/threads/thread-1#reply-1`,
        text: 'A reply body.',
        datePublished: '2024-01-03T00:00:00.000Z',
        author: {
          '@type': 'Person',
          name: 'Aino',
          url: `${ORIGIN}/profiles/uid-a`,
        },
      },
    ]);
  });

  it('states an edit date only when the edit is later than the creation', () => {
    const notEdited = buildDiscussionGraph({
      thread: thread({ updatedAt: new Date('2024-01-02T00:00:00.000Z') }),
      authorAttribution: aino,
      discussion: discussion([]),
      origin: ORIGIN,
    });
    const edited = buildDiscussionGraph({
      thread: thread({ updatedAt: new Date('2024-02-02T00:00:00.000Z') }),
      authorAttribution: aino,
      discussion: discussion([]),
      origin: ORIGIN,
    });

    expect(notEdited?.dateModified).toBeUndefined();
    expect(edited?.dateModified).toBe('2024-02-02T00:00:00.000Z');
  });

  it('omits a reply without a resolvable author while keeping the graph', () => {
    const graph = buildDiscussionGraph({
      thread: thread(),
      authorAttribution: aino,
      discussion: discussion([
        { reply: reply({ key: 'reply-1' }), author: aino },
        { reply: reply({ key: 'reply-2' }), author: undefined },
      ]),
      origin: ORIGIN,
    });

    expect(graph?.comment).toHaveLength(1);
    expect(graph?.comment?.[0]['@id']).toBe(
      `${ORIGIN}/threads/thread-1#reply-1`,
    );
  });

  it('omits a reply without a creation date while keeping the graph', () => {
    const graph = buildDiscussionGraph({
      thread: thread(),
      authorAttribution: aino,
      discussion: discussion([
        {
          reply: reply({ key: 'reply-1', createdAt: undefined }),
          author: aino,
        },
      ]),
      origin: ORIGIN,
    });

    expect(graph?.comment).toBeUndefined();
  });

  it('omits the whole graph when the opening post has no resolvable author', () => {
    expect(
      buildDiscussionGraph({
        thread: thread(),
        authorAttribution: null,
        discussion: discussion([{ reply: reply(), author: aino }]),
        origin: ORIGIN,
      }),
    ).toBeNull();
  });

  it('omits the whole graph when the opening post has no creation date', () => {
    expect(
      buildDiscussionGraph({
        thread: thread({ createdAt: undefined }),
        authorAttribution: aino,
        discussion: discussion([{ reply: reply(), author: aino }]),
        origin: ORIGIN,
      }),
    ).toBeNull();
  });
});

describe('serializeJsonLd', () => {
  const hostile =
    'Angle brackets <b>bold</b>, an ampersand &amp;, and </script><img src=x onerror=alert(1)>';

  it('leaves no script delimiter, angle bracket or ampersand in the output', () => {
    const output = serializeJsonLd({ text: hostile });

    expect(output).not.toContain('<');
    expect(output).not.toContain('>');
    expect(output).not.toContain('&');
    expect(output.toLowerCase()).not.toContain('</script');
  });

  it('parses back to the original user text', () => {
    expect(JSON.parse(serializeJsonLd({ text: hostile }))).toEqual({
      text: hostile,
    });
  });

  it('carries hostile reply text as data through the whole graph', () => {
    const graph = buildDiscussionGraph({
      thread: thread({ title: hostile }),
      authorAttribution: aino,
      discussion: discussion([
        { reply: reply({ markdownContent: hostile }), author: aino },
      ]),
      origin: ORIGIN,
    });

    const output = serializeJsonLd(graph);

    expect(output).not.toContain('<');
    expect(output).not.toContain('>');
    expect(output).not.toContain('&');

    const parsed = JSON.parse(output);
    expect(parsed.headline).toBe(hostile);
    expect(parsed.comment[0].text).toBe(hostile);
  });
});
