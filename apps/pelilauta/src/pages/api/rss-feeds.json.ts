import { logDebug, logError } from '@utils/logHelpers';
import type { APIRoute } from 'astro';
import Parser from 'rss-parser';

const FEEDS = [
  { name: 'myrrys', url: 'https://www.myrrys.com/blog/rss.xml', limit: 3 },
  {
    name: 'roolipelitiedotus',
    url: 'https://roolipelitiedotus.fi/feed/',
    limit: 3,
  },
];

const TIMEOUT_MS = 3000; // 3 second timeout

type RSSItem = {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
};

async function fetchRSSWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Parser.Output<unknown> | null> {
  try {
    const parser = new Parser({ timeout: timeoutMs });

    // Use Promise.race to ensure proper timeout for network requests
    const fetchPromise = parser.parseURL(url);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs),
    );

    const feed = await Promise.race([fetchPromise, timeoutPromise]);
    return feed;
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

export const GET: APIRoute = async () => {
  logDebug('api/rss-feeds', 'Fetching RSS feeds');

  // Fetch all feeds in parallel with timeout protection
  const feedPromises = FEEDS.map(async ({ name, url, limit }) => {
    const feed = await fetchRSSWithTimeout(url, TIMEOUT_MS);

    if (!feed) {
      return { name, posts: [] };
    }

    const posts = feed.items
      .filter(isValidRSSItem)
      .slice(0, limit)
      .map((item) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
      }));

    return { name, posts };
  });

  const results = await Promise.all(feedPromises);

  // Transform to object for easier consumption
  const feedData = results.reduce(
    (acc, { name, posts }) => {
      acc[name] = posts;
      return acc;
    },
    {} as Record<string, RSSItem[]>,
  );

  return new Response(JSON.stringify(feedData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // 10 min cache, 24 hour stale-while-revalidate
      'Cache-Control': 's-maxage=600, stale-while-revalidate=86400',
    },
  });
};
