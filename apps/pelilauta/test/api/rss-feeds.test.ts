/**
 * RSS Feeds API Tests
 *
 * Tests for the /api/rss-feeds.json endpoint that provides cached RSS feed data
 */

import { describe, expect, it } from 'vitest';
import { makeApiRequest } from './setup';

describe('/api/rss-feeds.json', () => {
  it('should return 200 OK status', async () => {
    const response = await makeApiRequest('/api/rss-feeds.json');
    expect(response.status).toBe(200);
  });

  it('should return JSON content type', async () => {
    const response = await makeApiRequest('/api/rss-feeds.json');
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');
  });

  it('should have correct cache headers', async () => {
    const response = await makeApiRequest('/api/rss-feeds.json');
    const cacheControl = response.headers.get('cache-control');
    expect(cacheControl).toContain('s-maxage=600');
    expect(cacheControl).toContain('stale-while-revalidate=86400');
  });

  it('should return feed data with expected structure', async () => {
    const response = await makeApiRequest('/api/rss-feeds.json');
    expect(response.ok).toBe(true);

    const data = await response.json();

    // Should have both feed properties
    expect(data).toHaveProperty('myrrys');
    expect(data).toHaveProperty('roolipelitiedotus');

    // Both should be arrays (may be empty if feeds fail)
    expect(Array.isArray(data.myrrys)).toBe(true);
    expect(Array.isArray(data.roolipelitiedotus)).toBe(true);
  });

  it('should return valid RSS item structure when feeds are available', async () => {
    const response = await makeApiRequest('/api/rss-feeds.json');
    const data = await response.json();

    // Check that if items exist, they have the correct structure
    const allItems = [...data.myrrys, ...data.roolipelitiedotus];

    for (const item of allItems) {
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('link');
      expect(item).toHaveProperty('pubDate');
      expect(item).toHaveProperty('contentSnippet');

      expect(typeof item.title).toBe('string');
      expect(typeof item.link).toBe('string');
      expect(typeof item.pubDate).toBe('string');
      expect(typeof item.contentSnippet).toBe('string');
    }
  });

  it('should handle feed failures gracefully (return empty arrays)', async () => {
    const response = await makeApiRequest('/api/rss-feeds.json');
    expect(response.status).toBe(200);

    const data = await response.json();

    // Even if feeds fail, should return empty arrays not null/undefined
    expect(data.myrrys).toBeDefined();
    expect(data.roolipelitiedotus).toBeDefined();
    expect(Array.isArray(data.myrrys)).toBe(true);
    expect(Array.isArray(data.roolipelitiedotus)).toBe(true);
  });

  it('should limit items to 3 per feed when available', async () => {
    const response = await makeApiRequest('/api/rss-feeds.json');
    const data = await response.json();

    // Each feed should return at most 3 items
    expect(data.myrrys.length).toBeLessThanOrEqual(3);
    expect(data.roolipelitiedotus.length).toBeLessThanOrEqual(3);
  });
});
