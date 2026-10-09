import type { User } from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({
  captureError: vi.fn(),
  pushSessionSnack: vi.fn(),
}));

vi.mock('src/utils/client/sentry', () => ({ captureError: h.captureError }));
vi.mock('src/utils/client/snackUtils', () => ({
  pushSessionSnack: h.pushSessionSnack,
}));
vi.mock('src/utils/i18n', () => ({ t: (key: string) => key }));
vi.mock('src/utils/logHelpers', () => ({ logError: vi.fn() }));

const { completeAuthFlow } = await import(
  '../../../src/utils/client/authUtils'
);

const user = {
  uid: 'A',
  getIdToken: vi.fn(async () => 'token-A'),
} as unknown as User;

const fetchMock = vi.fn();
const assign = vi.fn();
const store = new Map<string, string>();

beforeEach(() => {
  vi.clearAllMocks();
  store.clear();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('window', { location: { assign } });
  vi.stubGlobal('localStorage', {
    setItem: (k: string, v: string) => store.set(k, v),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('completeAuthFlow', () => {
  test('on 200 posts the token, writes the hints and redirects', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));

    await completeAuthFlow(user, '/channels');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/session');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ token: 'token-A' });
    expect(store.get('session-uid')).toBe('A');
    expect(store.get('session-state')).toBe('active');
    expect(assign).toHaveBeenCalledWith('/channels');
  });

  test.each([401, 500])(
    'on %i rejects without hints or redirect',
    async (code) => {
      fetchMock.mockResolvedValue(new Response('no', { status: code }));

      await expect(completeAuthFlow(user)).rejects.toThrow(
        `Session creation failed: ${code}`,
      );

      expect(store.size).toBe(0);
      expect(assign).not.toHaveBeenCalled();
    },
  );

  test('on a rejected fetch rejects without hints or redirect', async () => {
    fetchMock.mockRejectedValue(new TypeError('network down'));

    await expect(completeAuthFlow(user)).rejects.toThrow('network down');

    expect(store.size).toBe(0);
    expect(assign).not.toHaveBeenCalled();
  });
});
