import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';
import type { APIContext } from 'astro';
import Parser from 'rss-parser';

const ALLOWED_FEEDS = {
  myrrys: 'https://www.myrrys.com/blog/rss.xml',
  roolipelitiedotus: 'https://roolipelitiedotus.fi/feed/',
} as const;

interface CachedRssData {
  timestamp: number;
  data: Parser.Item[];
}

async function getFromCache(feedKey: string) {
  const store = getStore('rss-cache');
  return await store.get(feedKey, { type: 'json' });
}

async function saveToCache(feedKey: string, data: Parser.Item[]) {
  const store = getStore('rss-cache');
  await store.setJSON(feedKey, {
    timestamp: Date.now(),
    data,
  });
}

export async function GET({ params, request }: APIContext) {
  const { feedKey } = params;

  if (!feedKey || !(feedKey in ALLOWED_FEEDS)) {
    return new Response('Feed not allowed', { status: 403 });
  }

  try {
    const cached = await getFromCache(feedKey);
    if (cached) {
      const { timestamp, data } = cached as CachedRssData;
      const age = (Date.now() - timestamp) / 1000; // in seconds
      if (age < 1800) {
        // 30 minutes TTL
        const body = JSON.stringify(data);
        const etag = crypto.createHash('sha1').update(body).digest('hex');
        const ifNoneMatch = request.headers.get('if-none-match');
        if (ifNoneMatch === etag) {
          return new Response(null, { status: 304 });
        }
        return new Response(body, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600',
            ETag: etag,
            'X-Cache-Status': 'HIT',
          },
        });
      }
    }

    const parser = new Parser();
    const feed = await parser.parseURL(
      ALLOWED_FEEDS[feedKey as keyof typeof ALLOWED_FEEDS],
    );
    const posts = feed.items.slice(0, 3);

    await saveToCache(feedKey, posts);

    const body = JSON.stringify(posts);
    const etag = crypto.createHash('sha1').update(body).digest('hex');

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600',
        ETag: etag,
        'X-Cache-Status': 'MISS',
      },
    });
  } catch (error) {
    console.error(`Failed to fetch RSS feed for ${feedKey}:`, error);

    const cached = await getFromCache(feedKey);
    if (cached) {
      const { data } = cached as CachedRssData;
      return new Response(JSON.stringify(data), {
        status: 200, // Serve stale data with a 200
        headers: {
          'Content-Type': 'application/json',
          'X-Cache-Status': 'STALE',
        },
      });
    }

    return new Response(JSON.stringify([]), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
