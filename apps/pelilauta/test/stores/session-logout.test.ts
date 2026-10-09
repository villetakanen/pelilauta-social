import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({
  onChange: undefined as ((user: User | null) => Promise<void>) | undefined,
  order: [] as string[],
  signOut: vi.fn(),
  pushSessionSnack: vi.fn(),
  resetSubscriber: vi.fn(),
  unsubAccount: vi.fn(),
  unsubProfile: vi.fn(),
}));

vi.mock('@firebase/client', () => ({
  auth: {
    onAuthStateChanged: (cb: (user: User | null) => Promise<void>) => {
      h.onChange = cb;
    },
    signOut: h.signOut,
  },
}));
vi.mock('@utils/client/snackUtils', () => ({
  pushSnack: vi.fn(),
  pushSessionSnack: h.pushSessionSnack,
}));
vi.mock('../../src/stores/session/account', () => ({
  $account: {
    get: () => null,
    subscribe: () => () => {},
    listen: () => () => {},
  },
  subscribe: vi.fn(),
  reset: h.unsubAccount,
}));
vi.mock('../../src/stores/session/profile', () => ({
  subscribeToProfile: vi.fn(),
  unsubscribeFromProfile: h.unsubProfile,
  $profile: {},
  $profileMissing: {},
}));
vi.mock('../../src/stores/session/subscriber', () => ({
  initSubscriberStore: vi.fn(),
  resetSubscriberStore: h.resetSubscriber,
}));

vi.stubGlobal('window', {
  addEventListener: () => {},
  removeEventListener: () => {},
});
const { sessionState, uid, logout } = await import('../../src/stores/session');

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

beforeEach(() => {
  h.order.length = 0;
  for (const m of [fetchMock, h.signOut, h.pushSessionSnack]) m.mockReset();
  h.resetSubscriber.mockReset().mockImplementation(() => h.order.push('clear'));
  fetchMock.mockImplementation(async () => {
    h.order.push('delete');
    return new Response('', { status: 200 });
  });
  h.signOut.mockImplementation(async () => {
    h.order.push('signOut');
  });
  uid.set('A');
});

describe('logout', () => {
  test.each(['initial', 'loading', 'active', 'error'] as const)(
    'from %s: cookie, then local data, then Firebase',
    async (state) => {
      sessionState.set(state);
      expect(await logout()).toBe(true);

      expect(h.order).toEqual(['delete', 'clear', 'signOut']);
      expect(fetchMock.mock.calls[0][1]).toEqual({ method: 'DELETE' });
      expect(uid.get()).toBe('');
      expect(h.unsubAccount).toHaveBeenCalled();
      expect(h.unsubProfile).toHaveBeenCalled();
      expect(sessionState.get()).toBe('initial');
      expect(h.pushSessionSnack).not.toHaveBeenCalled();
    },
  );

  test.each([
    ['a network failure', () => Promise.reject(new TypeError('offline'))],
    ['HTTP 500', () => Promise.resolve(new Response('', { status: 500 }))],
  ])('a DELETE failing with %s stops before clearing', async (_n, del) => {
    sessionState.set('active');
    fetchMock.mockImplementation(del);

    expect(await logout()).toBe(false);
    expect(h.resetSubscriber).not.toHaveBeenCalled();
    expect(h.signOut).not.toHaveBeenCalled();
    expect(uid.get()).toBe('A');
    expect(sessionState.get()).toBe('error');
    expect(h.pushSessionSnack).toHaveBeenCalledWith(
      'snack:session.logoutIncomplete',
    );
  });

  test('a failed signOut reports after local data is cleared', async () => {
    sessionState.set('active');
    h.signOut.mockRejectedValue(new Error('auth'));

    expect(await logout()).toBe(false);
    expect(h.order).toEqual(['delete', 'clear']);
    expect(sessionState.get()).toBe('error');
    expect(h.pushSessionSnack).toHaveBeenCalledTimes(1);
  });

  test('concurrent callers share one run and its outcome', async () => {
    sessionState.set('active');
    const [a, b] = await Promise.all([logout(), logout()]);

    expect([a, b]).toEqual([true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(h.signOut).toHaveBeenCalledTimes(1);
  });

  test('the listener re-entry from signOut is absorbed', async () => {
    sessionState.set('active');
    h.signOut.mockImplementation(async () => {
      h.order.push('signOut');
      void h.onChange?.(null);
    });
    await logout();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(h.signOut).toHaveBeenCalledTimes(1);
  });

  test('a retry after failure runs every step again', async () => {
    sessionState.set('active');
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    expect(await logout()).toBe(false);

    expect(await logout()).toBe(true);
    expect(h.order).toEqual(['delete', 'clear', 'signOut']);
    expect(sessionState.get()).toBe('initial');
  });
});

describe('Firebase resolves no user', () => {
  test('initial state does not log out', async () => {
    sessionState.set('initial');
    await h.onChange?.(null);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(h.signOut).not.toHaveBeenCalled();
  });

  test.each(['active', 'loading', 'error'] as const)(
    '%s state logs out',
    async (state) => {
      sessionState.set(state);
      await h.onChange?.(null);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(sessionState.get()).toBe('initial');
    },
  );
});
