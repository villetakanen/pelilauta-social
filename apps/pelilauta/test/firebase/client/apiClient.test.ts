import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { auth, logout } = vi.hoisted(() => ({
  auth: {
    authStateReady: vi.fn(),
    currentUser: { getIdToken: vi.fn() },
    signOut: vi.fn(),
  },
  logout: vi.fn(),
}));

vi.mock('firebase/auth', () => ({ getAuth: () => auth }));
vi.mock('../../../src/firebase/client', () => ({ app: {} }));
vi.mock('src/stores/session', () => ({ logout }));

import { authedFetch } from '../../../src/firebase/client/apiClient';

const fetchMock = vi.fn();
const location = { href: '/threads/example' };

beforeEach(() => {
  vi.resetAllMocks();
  auth.authStateReady.mockResolvedValue(undefined);
  auth.currentUser.getIdToken.mockResolvedValue('token');
  logout.mockResolvedValue(true);
  location.href = '/threads/example';
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('window', { location });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('authedFetch forced logout', () => {
  it('waits for session cleanup before redirecting after a repeated 401', async () => {
    const rejected = new Response(null, { status: 401 });
    fetchMock.mockResolvedValue(rejected);
    let finishLogout!: (completed: boolean) => void;
    logout.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          finishLogout = resolve;
        }),
    );

    const request = authedFetch('/api/example');
    await vi.waitFor(() => expect(logout).toHaveBeenCalledOnce());
    expect(location.href).toBe('/threads/example');
    finishLogout(true);

    expect(await request).toBe(rejected);
    expect(location.href).toBe('/login');
    expect(auth.signOut).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(auth.currentUser.getIdToken).toHaveBeenLastCalledWith(true);
  });

  it('stays on the page when logout fails after a repeated 401', async () => {
    const rejected = new Response(null, { status: 401 });
    fetchMock.mockResolvedValue(rejected);
    logout.mockResolvedValue(false);

    expect(await authedFetch('/api/example')).toBe(rejected);
    expect(logout).toHaveBeenCalledOnce();
    expect(location.href).toBe('/threads/example');
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'uses session logout after token refresh fails (cleanup succeeds: %s)',
    async (completed) => {
      const error = new Error('Token refresh failed');
      fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
      auth.currentUser.getIdToken
        .mockResolvedValueOnce('token')
        .mockRejectedValueOnce(error);
      logout.mockResolvedValue(completed);

      await expect(authedFetch('/api/example')).rejects.toBe(error);
      expect(logout).toHaveBeenCalledOnce();
      expect(location.href).toBe(completed ? '/login' : '/threads/example');
      expect(auth.signOut).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledOnce();
    },
  );

  it('returns a successful retry without signing out', async () => {
    const success = new Response(null, { status: 200 });
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(success);

    expect(await authedFetch('/api/example')).toBe(success);
    expect(logout).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
    expect(location.href).toBe('/threads/example');
  });

  it('preserves the existing forced logout on a failed retry request', async () => {
    const error = new Error('Network unavailable');
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockRejectedValueOnce(error);

    await expect(authedFetch('/api/example')).rejects.toBe(error);
    expect(logout).toHaveBeenCalledOnce();
    expect(location.href).toBe('/login');
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});
