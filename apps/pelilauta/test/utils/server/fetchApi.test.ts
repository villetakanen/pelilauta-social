import { fetchApiJson } from '@utils/server/fetchApi';
import { afterEach, describe, expect, it, vi } from 'vitest';

const astro = { url: new URL('http://localhost:4321/threads/x') };

describe('fetchApiJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the parsed JSON of an ok response', async () => {
    const fetchMock = vi.fn(async (_url: URL) =>
      Response.json({ nick: 'Ada' }),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchApiJson(astro, '/api/profiles/a.json')).toEqual({
      nick: 'Ada',
    });
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'http://localhost:4321/api/profiles/a.json',
    );
  });

  it('returns null for a non-ok response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', async () => new Response('no', { status: 404 }));
    expect(await fetchApiJson(astro, '/api/profiles/a.json')).toBeNull();
  });

  it('returns null when the fetch throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', async () => {
      throw new Error('down');
    });
    expect(await fetchApiJson(astro, '/api/profiles/a.json')).toBeNull();
  });
});
