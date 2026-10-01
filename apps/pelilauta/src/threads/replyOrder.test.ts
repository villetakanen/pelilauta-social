import type { Reply } from 'src/schemas/ReplySchema';
import { describe, expect, it } from 'vitest';
import { compareReplies } from './replyOrder';

/**
 * The ordering constraint under test is stated in
 * specs/pelilauta/threads/replies/spec.md. Every reply the comparator sees
 * carries a creation time, because `ReplySchema` rejects a record without
 * one, so no case here constructs a reply the schema would reject.
 */

function reply(
  key: string,
  dates: { createdAt: Date; updatedAt?: Date; flowTime?: number },
): Reply {
  return {
    key,
    threadKey: 'thread',
    owners: ['author'],
    flowTime: dates.flowTime ?? dates.createdAt.getTime(),
    createdAt: dates.createdAt,
    updatedAt: dates.updatedAt,
  } as Reply;
}

function orderedKeys(replies: Reply[]): string[] {
  return [...replies].sort(compareReplies).map((item) => item.key);
}

const EARLY = new Date('2024-02-04T10:00:00.000Z');
const LATE = new Date('2024-02-05T10:00:00.000Z');
const EDIT = new Date('2024-06-01T10:00:00.000Z');

describe('compareReplies', () => {
  it('sorts by creation time in ascending order', () => {
    expect(
      orderedKeys([
        reply('second', { createdAt: LATE }),
        reply('first', { createdAt: EARLY }),
      ]),
    ).toEqual(['first', 'second']);
  });

  it('breaks an equal creation time by key in ascending lexical order', () => {
    expect(
      orderedKeys([
        reply('b', { createdAt: EARLY }),
        reply('a', { createdAt: EARLY }),
      ]),
    ).toEqual(['a', 'b']);
  });

  it('never lets an edit timestamp alter the order', () => {
    // `toClientEntry` carries the edit timestamp into `flowTime` for a record
    // storing none, so an edited reply reaches the comparator with a flowTime
    // later than every other reply's.
    expect(
      orderedKeys([
        reply('later', { createdAt: LATE }),
        reply('earlier-but-edited', {
          createdAt: EARLY,
          updatedAt: EDIT,
          flowTime: EDIT.getTime(),
        }),
      ]),
    ).toEqual(['earlier-but-edited', 'later']);
  });

  it('never lets an edit timestamp break a tie between equal creation times', () => {
    expect(
      orderedKeys([
        reply('b', { createdAt: EARLY }),
        reply('a', {
          createdAt: EARLY,
          updatedAt: EDIT,
          flowTime: EDIT.getTime(),
        }),
      ]),
    ).toEqual(['a', 'b']);
  });
});
