import type { FeedData, RSSItem } from '@pages/api/rss-feeds.json';

/*
 * The stream's order: `specs/pelilauta/syndicated-feeds/spec.md`.
 *
 * A pure function of the API response, so the ordering and the guarantee rule are
 * testable without a render and without a network.
 */

export type SyndicatedPost = RSSItem & {
  /** What the reader is told published this. */
  label: string;
  /** Where that publisher lives. */
  homeUrl: string;
  /** The publisher's key, which is how a guarantee finds its own posts. */
  source: string;
};

/** How many posts the stream holds. */
export const STREAM_LENGTH = 5;

function byRecency(a: SyndicatedPost, b: SyndicatedPost): number {
  const difference = Date.parse(b.pubDate) - Date.parse(a.pubDate);
  // A publisher's key breaks a tie, so the same response always renders the same stream.
  return difference !== 0 ? difference : a.source.localeCompare(b.source);
}

export function mergeSyndicateFeeds(
  feedData: FeedData,
  length = STREAM_LENGTH,
): SyndicatedPost[] {
  const everything: SyndicatedPost[] = Object.entries(feedData).flatMap(
    ([source, { label, homeUrl, items }]) =>
      items.map((item) => ({ ...item, label, homeUrl, source })),
  );

  const byDate = [...everything].sort(byRecency);
  const stream = byDate.slice(0, length);

  /*
   * The guarantees, in the configuration's order and one at a time. Each takes the place
   * of the oldest post from a publisher that is not guaranteed, so a place an earlier
   * guarantee has taken is not one a later guarantee can take — the stream is scanned
   * from its end for a post whose own publisher holds no guarantee.
   */
  for (const [source, envelope] of Object.entries(feedData)) {
    if (!envelope.guaranteed) continue;
    if (stream.some((post) => post.source === source)) continue;

    const claimant = byDate.find(
      (post) => post.source === source && !stream.includes(post),
    );
    if (!claimant) continue;

    const yielding = stream.reduce<number>(
      (oldest, post, index) =>
        feedData[post.source]?.guaranteed
          ? oldest
          : oldest === -1 || byRecency(post, stream[oldest]) > 0
            ? index
            : oldest,
      -1,
    );

    /*
     * Every place is held by a guarantee, which the order reached first, so they keep
     * them. A claimant exists only where the stream is full — below that it is already
     * in the stream and the guarantee was satisfied above.
     */
    if (yielding === -1) continue;

    stream[yielding] = claimant;
  }

  return stream.sort(byRecency);
}
