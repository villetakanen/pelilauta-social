// rss/threads.xml.ts
import rss, { type RSSFeedItem } from '@astrojs/rss';
import type { APIContext } from 'astro';
import { marked } from 'marked';
import { parseThread, type Thread } from 'src/schemas/ThreadSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { t } from 'src/utils/i18n';
import { createPlainSnippet } from 'src/utils/snippetHelpers';

export async function GET({ request }: APIContext) {
  /*if (import.meta.env.SECRET_FEATURE_FLAG_RSS !== 'true') {
    return new Response('Not Implemented', {
      status: 501,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }*/

  const url = new URL('/api/threads.json', request.url);
  const response = await fetch(url.toString());
  const allThreadsDocs = await response.json();

  const allThreads: Thread[] = allThreadsDocs.map((thread: Partial<Thread>) =>
    parseThread(toClientEntry(thread), thread.key),
  );

  const items: RSSFeedItem[] = await Promise.all(
    allThreads.map(async (thread) => ({
      title: thread.title,
      link: `/threads/${thread.key}`,
      description: createPlainSnippet(thread.markdownContent || '', 500),
      content: await marked(thread.markdownContent || ''),
      pubDate: new Date(thread.createdAt),
      enclosure: thread.images?.[0]?.url
        ? {
            url: thread.images[0].url,
            type: 'image/webp',
            length: 0,
          }
        : undefined,
    })),
  );

  return rss({
    title: t('app:title'),
    description: t('app:meta.description'),
    site: new URL('/api/threads.json', request.url).origin,
    items,
    stylesheet: '/rss/styles.xsl',
  });
}
