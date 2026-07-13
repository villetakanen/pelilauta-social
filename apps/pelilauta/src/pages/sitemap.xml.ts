import type { APIContext } from 'astro';
import { TAG_SYNONYMS } from '../schemas/TagSynonyms';

export async function GET({ request }: APIContext) {
  const origin = new URL(request.url).origin;

  // Static important pages (PBI-026)
  const staticPages = [
    { url: '/', priority: '0.9' },
    { url: '/sites', priority: '0.8' },
    { url: '/channels', priority: '0.8' },
  ];

  // Featured tags (only canonical tags, not synonyms) (PBI-027)
  const featuredTags = TAG_SYNONYMS.map((t) => ({
    url: `/tags/${encodeURIComponent(t.canonicalTag)}`,
    priority: '0.7',
  }));

  // Fetch all public sites
  let publicSitesJson = [];
  try {
    const publicSitesResponse = await fetch(`${origin}/api/sites`);
    if (publicSitesResponse.ok) {
      publicSitesJson = await publicSitesResponse.json();
    }
  } catch (error) {
    console.error('Failed to fetch sites for sitemap:', error);
  }

  const publicSites = Array.isArray(publicSitesJson)
    ? publicSitesJson.map((site: { key: string }) => `/sites/${site.key}`)
    : [];

  // Generate URLs for all pages in public sites (PBI-028)
  const publicSitePages: string[] = [];
  if (Array.isArray(publicSitesJson)) {
    for (const site of publicSitesJson) {
      if (site.pageRefs && Array.isArray(site.pageRefs)) {
        for (const pageRef of site.pageRefs) {
          publicSitePages.push(`/sites/${site.key}/${pageRef.key}`);
        }
      }
    }
  }

  // Fetch latest public threads
  let publicThreadsJson = [];
  try {
    const publicThreadsResponse = await fetch(`${origin}/api/threads.json`);
    if (publicThreadsResponse.ok) {
      publicThreadsJson = await publicThreadsResponse.json();
    }
  } catch (error) {
    console.error('Failed to fetch threads for sitemap:', error);
  }

  const publicThreads = Array.isArray(publicThreadsJson)
    ? publicThreadsJson.map(
        (thread: { key: string }) => `/threads/${thread.key}`,
      )
    : [];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          ${staticPages.map((page) => `<url><loc>${origin}${page.url}</loc><priority>${page.priority}</priority></url>`).join('')}
          ${featuredTags.map((tag) => `<url><loc>${origin}${tag.url}</loc><priority>${tag.priority}</priority></url>`).join('')}
          ${publicSites.map((site: string) => `<url><loc>${origin}${site}</loc><priority>0.6</priority></url>`).join('')}
          ${publicSitePages.map((page: string) => `<url><loc>${origin}${page}</loc><priority>0.5</priority></url>`).join('')}
          ${publicThreads.map((thread: string) => `<url><loc>${origin}${thread}</loc><priority>0.5</priority></url>`).join('')}
        </urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=60',
      'CDN-Cache-Control': 'max-age=360',
      'Vercel-CDN-Cache-Control': 'max-age=3600',
    },
  });
}
