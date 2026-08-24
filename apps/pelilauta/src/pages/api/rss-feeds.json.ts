import { RSS_FEEDS, type RSSFeedConfig } from '@pelilauta/_rss-feeds.config';
import { logDebug, logError } from '@utils/logHelpers';
import type { APIRoute } from 'astro';
import Parser from 'rss-parser';

/*
 * The syndicated feeds' one boundary: `specs/pelilauta/syndicated-feeds/spec.md`.
 *
 * The network lives here. This route knows a feed is RSS, and the stream that renders
 * from the response does not — it reads no feed address and imports no parser.
 *
 * Each publisher answers in its own envelope, carrying what the stream needs to name and
 * rank it. That is why a publisher is added by editing the configuration and nothing
 * downstream reads that file.
 */

export type RSSItem = {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
};

export type FeedEnvelope = {
  label: string;
  homeUrl: string;
  guaranteed: boolean;
  items: RSSItem[];
};

export type FeedData = Record<string, FeedEnvelope>;

const TIMEOUT_MS = 3000;

/*
 * `rss-parser`'s own timeout governs the socket; the race governs the wait. A feed that
 * accepts the connection and then stalls holds the parser's promise open past its
 * timeout, and the front page is behind this.
 */
async function fetchRSSWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Parser.Output<unknown> | null> {
  try {
    const parser = new Parser({ timeout: timeoutMs });
    return await Promise.race([
      parser.parseURL(url),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs),
      ),
    ]);
  } catch (error) {
    logError('fetchRSSWithTimeout', 'RSS fetch failed', { url, error });
    return null;
  }
}

function isValidRSSItem(item: unknown): item is RSSItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'title' in item &&
    typeof item.title === 'string' &&
    'link' in item &&
    typeof item.link === 'string' &&
    'pubDate' in item &&
    typeof item.pubDate === 'string' &&
    'contentSnippet' in item &&
    typeof item.contentSnippet === 'string'
  );
}

async function readFeed(feed: RSSFeedConfig): Promise<[string, FeedEnvelope]> {
  const parsed = await fetchRSSWithTimeout(feed.url, TIMEOUT_MS);

  /*
   * One publisher failing costs its own posts alone. An empty envelope is what that
   * costs: the publisher stays in the response, so a guarantee it holds is still read
   * and simply finds nothing to place.
   */
  const items = parsed
    ? parsed.items
        .filter(isValidRSSItem)
        .slice(0, feed.limit)
        .map(({ title, link, pubDate, contentSnippet }) => ({
          title,
          link,
          pubDate,
          contentSnippet,
        }))
    : [];

  return [
    feed.name,
    {
      label: feed.label,
      homeUrl: feed.homeUrl,
      guaranteed: Boolean(feed.guaranteed),
      items,
    },
  ];
}

export const GET: APIRoute = async () => {
  logDebug('api/rss-feeds', 'Fetching RSS feeds');

  const envelopes = await Promise.all(RSS_FEEDS.map(readFeed));

  /*
   * The configuration's order sets the insertion order, and `Object.entries` preserves
   * it for string keys. The guarantees are honoured in that order, so this is load-bearing.
   */
  const feedData: FeedData = Object.fromEntries(envelopes);

  return new Response(JSON.stringify(feedData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      /*
       * `stale-if-error` is what keeps the stream populated through somebody else's
       * outage: without it the front page empties out the moment the cache expires while
       * a publisher is unreachable.
       */
      'Cache-Control':
        's-maxage=600, stale-while-revalidate=86400, stale-if-error=86400',
    },
  });
};
