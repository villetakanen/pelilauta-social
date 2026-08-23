import type { FeedData, FeedEnvelope, RSSItem } from '@pelilauta/pages/api/rss-feeds.json';
import {
  mergeSyndicateFeeds,
  type SyndicatedPost,
} from '@pelilauta/components/server/FrontPage/SyndicateStream/mergeSyndicateFeeds';
import { describe, expect, it } from 'vitest';

/*
 * Tests the pure ordering and guarantee rule against
 * `specs/pelilauta/syndicated-feeds/spec.md` (Constraints, Scenarios).
 *
 * `day(n, hour)` gives every fixture a distinct, legible point on one timeline:
 * a higher `n` (and, within a day, a higher `hour`) is always more recent.
 */
function day(n: number, hour = 0): string {
  return `2024-01-${String(n).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`;
}

function item(id: string, pubDate: string): RSSItem {
  return {
    title: id,
    link: `https://example.com/${id}`,
    pubDate,
    contentSnippet: id,
  };
}

function envelope(
  items: RSSItem[],
  guaranteed = false,
  label?: string,
): FeedEnvelope {
  return {
    label: label ?? 'publisher',
    homeUrl: 'https://example.com',
    guaranteed,
    items,
  };
}

/** The post ids the stream rendered, in the order it rendered them. */
function ids(stream: SyndicatedPost[]): string[] {
  return stream.map((post) => post.title);
}

describe('mergeSyndicateFeeds', () => {
  // Scenario: "Given two publishers with three posts each, the five most
  // recent of the six appear, newest first, and the sixth does not."
  it('keeps the five most recent posts of six, newest first, and drops the oldest', () => {
    const feedData: FeedData = {
      a: envelope([item('a1', day(1)), item('a3', day(3)), item('a5', day(5))]),
      b: envelope([item('b2', day(2)), item('b4', day(4)), item('b6', day(6))]),
    };

    const stream = mergeSyndicateFeeds(feedData);

    expect(ids(stream)).toEqual(['b6', 'a5', 'b4', 'a3', 'b2']);
  });

  // Scenario: "Given a guaranteed publisher whose posts are all older than
  // five others, its most recent post appears, and the oldest post from a
  // publisher that is not guaranteed does not."
  it('seats a guaranteed publisher absent from the natural top five, yielding the stream\'s oldest non-guaranteed post', () => {
    const feedData: FeedData = {
      g: envelope([item('g1', day(1)), item('g2', day(2))], true, 'Guaranteed'),
      p: envelope([
        item('p3', day(3)),
        item('p4', day(4)),
        item('p5', day(5)),
        item('p6', day(6)),
        item('p7', day(7)),
      ]),
    };

    const stream = mergeSyndicateFeeds(feedData);

    // g's most recent post (g2) is seated; its older post (g1) is not.
    expect(ids(stream)).toContain('g2');
    expect(ids(stream)).not.toContain('g1');
    // p3 was the oldest post naturally in the stream, and yields its place.
    expect(ids(stream)).not.toContain('p3');
    expect(ids(stream)).toEqual(['p7', 'p6', 'p5', 'p4', 'g2']);
  });

  // Scenario: "Given two guaranteed publishers, neither among the five most
  // recent posts, the most recent post from each appears, and the two
  // oldest posts from publishers that are not guaranteed do not."
  //
  // Also pins the Constraints case: two guaranteed publishers both absent
  // from the natural top five, both placeable — each publisher's most
  // recent post is seated, and the seats given up are the oldest posts held
  // by non-guaranteed publishers. A place one guarantee has taken is not one
  // the other guarantee — reached later in configuration order — can take.
  it('seats both of two absent guaranteed publishers, each yielding a distinct non-guaranteed seat, in configuration order', () => {
    const feedData: FeedData = {
      // Configuration order: g1 before g2 — the key order of this object is
      // the order the route's Object.fromEntries preserves and the function
      // reads back with Object.entries.
      g1: envelope([item('g1-old', day(1)), item('g1-new', day(2))], true, 'G1'),
      g2: envelope([item('g2-old', day(3)), item('g2-new', day(4))], true, 'G2'),
      p: envelope([
        item('p5', day(5)),
        item('p6', day(6)),
        item('p7', day(7)),
        item('p8', day(8)),
        item('p9', day(9)),
      ]),
    };

    const stream = mergeSyndicateFeeds(feedData);

    // Exact resulting set, in the exact rendered order: the three newest
    // p posts, plus each guarantee's most recent post — g2's ahead of g1's,
    // by recency, not by the order the guarantees were honoured in.
    expect(ids(stream)).toEqual(['p9', 'p8', 'p7', 'g2-new', 'g1-new']);
    // The two oldest p posts — the seats given up — are gone, and so are
    // the guaranteed publishers' own older posts.
    expect(ids(stream)).not.toContain('p5');
    expect(ids(stream)).not.toContain('p6');
    expect(ids(stream)).not.toContain('g1-old');
    expect(ids(stream)).not.toContain('g2-old');
  });

  // Scenario: "Given a guaranteed publisher that returned no posts, no place
  // is held for it, and the stream renders the posts it has."
  it('holds no place for a guaranteed publisher with no posts', () => {
    const feedData: FeedData = {
      g: envelope([], true, 'Guaranteed'),
      p: envelope([item('p1', day(1)), item('p2', day(2)), item('p3', day(3))]),
    };

    const stream = mergeSyndicateFeeds(feedData);

    expect(ids(stream)).toEqual(['p3', 'p2', 'p1']);
  });

  // The pure-function analogue of "one publisher's feed times out and
  // another answers": a timed-out publisher reaches this function as an
  // envelope with no items (see rss-feeds.json.ts's readFeed), costing only
  // its own posts. (The logging half of that scenario is the route's
  // concern, not this pure function's — it is not exercised here.)
  it('renders the answering publisher\'s posts when another publisher has none', () => {
    const feedData: FeedData = {
      down: envelope([]),
      up: envelope([item('u1', day(1)), item('u2', day(2))]),
    };

    const stream = mergeSyndicateFeeds(feedData);

    expect(ids(stream)).toEqual(['u2', 'u1']);
  });

  // Constraint: "where the guarantees outnumber the places, the ones the
  // order reaches first get them." Six guaranteed publishers, one post
  // each, competing for five places once every non-guaranteed seat is
  // already spent — configuration order, not the excluded publisher's own
  // recency, decides who is left out.
  it('seats guaranteed publishers in configuration order when guarantees outnumber the places', () => {
    const feedData: FeedData = {
      g1: envelope([item('g1', day(1))], true, 'G1'),
      g2: envelope([item('g2', day(2))], true, 'G2'),
      g3: envelope([item('g3', day(3))], true, 'G3'),
      g4: envelope([item('g4', day(4))], true, 'G4'),
      g5: envelope([item('g5', day(5))], true, 'G5'),
      // g6's own post is the most recent of all six guaranteed posts, yet
      // configuration order still reaches it last, with no seat left.
      g6: envelope([item('g6', day(6))], true, 'G6'),
      p: envelope([
        item('p16', day(16)),
        item('p17', day(17)),
        item('p18', day(18)),
        item('p19', day(19)),
        item('p20', day(20)),
      ]),
    };

    const stream = mergeSyndicateFeeds(feedData);

    expect(ids(stream)).toEqual(['g5', 'g4', 'g3', 'g2', 'g1']);
    expect(ids(stream)).not.toContain('g6');
  });

  // Constraint: a guaranteed publisher already present naturally is left
  // alone — nothing is substituted, and no other post is evicted.
  it('leaves the stream untouched when a guaranteed publisher is already present naturally', () => {
    const feedData: FeedData = {
      g: envelope([item('g5', day(5))], true, 'Guaranteed'),
      p: envelope([
        item('p1', day(1)),
        item('p2', day(2)),
        item('p3', day(3)),
        item('p4', day(4)),
      ]),
    };

    const stream = mergeSyndicateFeeds(feedData);

    expect(ids(stream)).toEqual(['g5', 'p4', 'p3', 'p2', 'p1']);
  });

  // Constraint: "the stream holds at most five posts, and shows fewer
  // rather than filling the space." Fewer posts than the stream holds:
  // every post renders, and nothing pads the rest.
  it('renders every post, unpadded, when fewer posts exist than the stream holds', () => {
    const feedData: FeedData = {
      p: envelope([item('p1', day(1)), item('p2', day(2))]),
    };

    const stream = mergeSyndicateFeeds(feedData);

    expect(stream).toHaveLength(2);
    expect(ids(stream)).toEqual(['p2', 'p1']);
    expect(stream.every((post) => post !== undefined && post !== null)).toBe(true);
  });

  // Constraint: "Posts carry no date... recency orders the stream." Two
  // posts sharing one pubDate still render in one deterministic order: the
  // implementation breaks the tie on the publisher's key.
  it('breaks an identical-pubDate tie deterministically, by publisher key', () => {
    const feedData: FeedData = {
      zulu: envelope([item('z1', day(1))]),
      alpha: envelope([item('a1', day(1))]),
    };

    const first = ids(mergeSyndicateFeeds(feedData));
    const second = ids(mergeSyndicateFeeds(feedData));

    // Deterministic: repeated calls over the same response render the same
    // order.
    expect(first).toEqual(second);
    // 'alpha' sorts before 'zulu' on the publisher key.
    expect(first).toEqual(['a1', 'z1']);
  });

  // Constraint / Definition of Done: the final stream is ordered newest
  // first, even when a guarantee is honoured out of date order. Config
  // order seats g1 (day 5, oldest) before g2 (day 1, older still), each
  // yielding whichever non-guaranteed seat is then weakest — an
  // insertion-order render would misplace g2's older post ahead of g1's
  // newer one; only a final full re-sort renders them correctly.
  it('renders newest-first even when guarantees are honoured out of date order', () => {
    const feedData: FeedData = {
      g1: envelope([item('g1', day(5))], true, 'G1'),
      g2: envelope([item('g2', day(1))], true, 'G2'),
      p: envelope([
        item('p6', day(6)),
        item('p7', day(7)),
        item('p8', day(8)),
        item('p9', day(9)),
        item('p10', day(10)),
      ]),
    };

    const stream = mergeSyndicateFeeds(feedData);

    expect(ids(stream)).toEqual(['p10', 'p9', 'p8', 'g1', 'g2']);
    // Pin the ordering explicitly: newest to oldest by pubDate.
    for (let i = 1; i < stream.length; i++) {
      expect(Date.parse(stream[i - 1].pubDate)).toBeGreaterThanOrEqual(
        Date.parse(stream[i].pubDate),
      );
    }
  });
});
