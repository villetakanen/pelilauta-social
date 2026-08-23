/*
 * The publishers the front page syndicates: `specs/pelilauta/syndicated-feeds/spec.md`.
 *
 * Configuration rather than implementation, so it sits at the surface of the application
 * where an editor looks for it, and adding a publisher is a change to this file alone.
 */

export type RSSFeedConfig = {
  /** The publisher's key in the API response. */
  name: string;
  /** The feed to read. */
  url: string;
  /** Where the publisher lives, which the reader is offered beside its posts. */
  homeUrl: string;
  /** What the reader is told published the post. */
  label: string;
  /** How many of the publisher's posts to carry. */
  limit: number;
  /**
   * A guaranteed publisher holds a place in the stream that recency alone would have
   * given away. The spec's Context states who is declared so, and why.
   */
  guaranteed?: boolean;
};

export const RSS_FEEDS: RSSFeedConfig[] = [
  {
    name: 'myrrys',
    url: 'https://www.myrrys.com/blog/rss.xml',
    homeUrl: 'https://www.myrrys.com',
    label: 'Myrrys.com',
    limit: 3,
    guaranteed: true,
  },
  {
    name: 'roolipelitiedotus',
    url: 'https://roolipelitiedotus.fi/feed/',
    homeUrl: 'https://roolipelitiedotus.fi',
    label: 'Roolipelitiedotus.fi',
    limit: 3,
  },
];
