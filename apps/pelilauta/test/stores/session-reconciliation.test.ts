import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({
  onChange: undefined as ((user: User | null) => Promise<void>) | undefined,
  signOut: vi.fn(),
  pushSnack: vi.fn(),
}));

vi.mock('@firebase/client', () => ({
  auth: {
    onAuthStateChanged: (cb: (user: User | null) => Promise<void>) => {
      h.onChange = cb;
    },
    signOut: h.signOut,
  },
}));
vi.mock('@utils/client/snackUtils', () => ({ pushSnack: h.pushSnack }));
vi.mock('../../src/stores/session/account', () => ({
  $account: {
    get: () => null,
    subscribe: () => () => {},
    listen: () => () => {},
  },
  subscribe: vi.fn(),
  reset: vi.fn(),
}));
vi.mock('../../src/stores/session/profile', () => ({
  subscribeToProfile: vi.fn(),
  unsubscribeFromProfile: vi.fn(),
  $profile: {},
  $profileMissing: {},
}));
vi.mock('../../src/stores/session/subscriber', () => ({
  initSubscriberStore: vi.fn(),
}));

// The store attaches its auth listener only where a window exists.
vi.stubGlobal('window', {
  addEventListener: () => {},
  removeEventListener: () => {},
});
const { sessionState, uid } = await import('../../src/stores/session');

const user = {
  uid: 'A',
  getIdToken: vi.fn(async () => 'token-A'),
} as unknown as User;

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200 });
const status = (code: number) => new Response('', { status: code });
const matching = () => ok({ uid: 'A', expiresAt: 1900000000 });

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const calls = (method: string) =>
  fetchMock.mock.calls.filter(([, init]) => (init?.method ?? 'GET') === method);

beforeEach(() => {
  fetchMock.mockReset();
  h.signOut.mockReset();
  h.pushSnack.mockReset();
  sessionState.set('initial');
  uid.set('');
});

describe('session reconciliation', () => {
  test('a matching cookie activates without a POST', async () => {
    fetchMock.mockResolvedValueOnce(matching());
    await h.onChange?.(user);

    expect(calls('POST')).toHaveLength(0);
    expect(sessionState.get()).toBe('active');
    expect(uid.get()).toBe('A');
  });

  test.each([
    ['HTTP 401', () => status(401)],
    [
      'a cookie for another account',
      () => ok({ uid: 'B', expiresAt: 1900000000 }),
    ],
  ])('%s is repaired by one POST, without a second GET', async (_n, first) => {
    fetchMock.mockResolvedValueOnce(first()).mockResolvedValueOnce(status(200));
    await h.onChange?.(user);

    expect(calls('POST')).toHaveLength(1);
    expect(JSON.parse(calls('POST')[0][1].body)).toEqual({ token: 'token-A' });
    expect(calls('GET')).toHaveLength(1);
    expect(sessionState.get()).toBe('active');
  });

  test('persisted active state does not replace the status check', async () => {
    sessionState.set('active');
    uid.set('A');
    fetchMock
      .mockResolvedValueOnce(status(401))
      .mockResolvedValueOnce(status(200));
    await h.onChange?.(user);

    expect(calls('GET')).toHaveLength(1);
    expect(calls('POST')).toHaveLength(1);
  });

  test.each([
    ['HTTP 500', () => Promise.resolve(status(500))],
    ['HTTP 503', () => Promise.resolve(status(503))],
    ['a network failure', () => Promise.reject(new TypeError('offline'))],
  ])(
    'a repair POST failing with %s is not active and keeps Firebase auth',
    async (_n, post) => {
      uid.set('A');
      fetchMock.mockResolvedValueOnce(status(401)).mockImplementationOnce(post);
      await h.onChange?.(user);

      expect(sessionState.get()).toBe('error');
      expect(h.signOut).not.toHaveBeenCalled();
      expect(h.pushSnack).not.toHaveBeenCalled();
      expect(uid.get()).toBe('A');

      fetchMock
        .mockResolvedValueOnce(status(401))
        .mockResolvedValueOnce(status(200));
      await h.onChange?.(user);
      expect(sessionState.get()).toBe('active');
    },
  );

  test('a failed token refresh is temporary and keeps Firebase auth', async () => {
    vi.mocked(user.getIdToken).mockRejectedValueOnce(new TypeError('offline'));
    fetchMock.mockResolvedValueOnce(status(401));
    await h.onChange?.(user);

    expect(calls('POST')).toHaveLength(0);
    expect(sessionState.get()).toBe('error');
    expect(h.signOut).not.toHaveBeenCalled();
  });

  test('a rejected repair POST (401) takes the error path and logs out', async () => {
    fetchMock
      .mockResolvedValueOnce(status(401))
      .mockResolvedValueOnce(status(401))
      .mockResolvedValue(status(200));
    await h.onChange?.(user);

    expect(sessionState.get()).not.toBe('active');
    expect(h.pushSnack).toHaveBeenCalledWith('app.login.error.firebase');
    expect(h.signOut).toHaveBeenCalled();
  });

  test.each([
    ['a network failure', () => Promise.reject(new TypeError('offline'))],
    ['HTTP 503', () => Promise.resolve(status(503))],
    ['HTTP 500', () => Promise.resolve(status(500))],
    [
      'a body without uid',
      () => Promise.resolve(ok({ expiresAt: 1900000000 })),
    ],
    [
      'a non-integer expiresAt',
      () => Promise.resolve(ok({ uid: 'A', expiresAt: 'soon' })),
    ],
    [
      'a non-JSON body',
      () => Promise.resolve(new Response('OK', { status: 200 })),
    ],
  ])(
    'an inconclusive GET (%s) sends no POST, keeps auth, and a later check recovers',
    async (_n, get) => {
      sessionState.set('active');
      uid.set('A');
      fetchMock.mockImplementationOnce(get);
      await h.onChange?.(user);

      expect(calls('POST')).toHaveLength(0);
      expect(h.signOut).not.toHaveBeenCalled();
      expect(h.pushSnack).not.toHaveBeenCalled();
      expect(uid.get()).toBe('A');
      expect(sessionState.get()).toBe('error');

      fetchMock.mockResolvedValueOnce(matching());
      await h.onChange?.(user);
      expect(sessionState.get()).toBe('active');
    },
  );
});
