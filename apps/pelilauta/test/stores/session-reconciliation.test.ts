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
vi.mock('@utils/client/snackUtils', () => ({
  pushSnack: h.pushSnack,
  pushSessionSnack: vi.fn(),
}));
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
  resetSubscriberStore: vi.fn(),
}));

// The store attaches its auth listener only where a window exists.
vi.stubGlobal('window', {
  addEventListener: () => {},
  removeEventListener: () => {},
});
const { sessionState, uid, logout } = await import('../../src/stores/session');
const { subscribe } = await import('../../src/stores/session/account');
const { initSubscriberStore } = await import(
  '../../src/stores/session/subscriber'
);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

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
  vi.mocked(subscribe).mockReset();
  vi.mocked(initSubscriberStore).mockReset();
  sessionState.set('initial');
  uid.set('');
});

describe('session reconciliation', () => {
  test.each(['success', 'network failure', 'HTTP 401'])(
    'logout supersedes a late POST %s',
    async (outcome) => {
      const post = deferred<Response>();
      fetchMock
        .mockResolvedValueOnce(status(401))
        .mockReturnValueOnce(post.promise)
        .mockResolvedValue(status(200));
      const restoring = h.onChange?.(user);
      await vi.waitFor(() => expect(calls('POST')).toHaveLength(1));
      const leaving = logout();
      expect(calls('DELETE')).toHaveLength(0);
      if (outcome === 'network failure') post.reject(new TypeError('offline'));
      else post.resolve(status(outcome === 'HTTP 401' ? 401 : 200));
      await restoring;
      expect(await leaving).toBe(true);
      expect(calls('DELETE')).toHaveLength(1);
      expect(uid.get()).toBe('');
      expect(sessionState.get()).toBe('initial');
      expect(subscribe).not.toHaveBeenCalled();
      expect(h.pushSnack).not.toHaveBeenCalled();
    },
  );

  test('a new identity checks status only after older cookie creation settles', async () => {
    const post = deferred<Response>();
    fetchMock
      .mockResolvedValueOnce(status(401))
      .mockReturnValueOnce(post.promise)
      .mockResolvedValueOnce(matching())
      .mockResolvedValueOnce(status(200));
    const first = h.onChange?.(user);
    await vi.waitFor(() => expect(calls('POST')).toHaveLength(1));
    const second = h.onChange?.({ ...user, uid: 'B' } as User);
    expect(calls('GET')).toHaveLength(1);
    post.resolve(status(200));
    await Promise.all([first, second]);
    expect(
      fetchMock.mock.calls.map(([, init]) => init?.method ?? 'GET'),
    ).toEqual(['GET', 'POST', 'GET', 'POST']);
    expect(uid.get()).toBe('B');
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledWith('B', expect.any(Function));
  });

  test('an obsolete status check does not replace the new account', async () => {
    const get = deferred<Response>();
    fetchMock
      .mockReturnValueOnce(get.promise)
      .mockResolvedValueOnce(ok({ uid: 'B', expiresAt: 1900000000 }));
    const first = h.onChange?.(user);
    await vi.waitFor(() => expect(calls('GET')).toHaveLength(1));
    await h.onChange?.({ ...user, uid: 'B' } as User);
    get.resolve(matching());
    await first;
    expect(uid.get()).toBe('B');
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledWith('B', expect.any(Function));
  });

  test('logout during account setup prevents subsequent subscriptions and activation', async () => {
    const account = deferred<void>();
    vi.mocked(subscribe).mockReturnValueOnce(account.promise);
    fetchMock.mockResolvedValueOnce(matching()).mockResolvedValue(status(200));
    const restoring = h.onChange?.(user);
    await vi.waitFor(() => expect(subscribe).toHaveBeenCalled());
    expect(await logout()).toBe(true);
    account.resolve();
    await restoring;
    expect(initSubscriberStore).not.toHaveBeenCalled();
    expect(uid.get()).toBe('');
    expect(sessionState.get()).toBe('initial');
  });

  test('failed logout still supersedes earlier setup and permits new reconciliation', async () => {
    const account = deferred<void>();
    vi.mocked(subscribe).mockReturnValueOnce(account.promise);
    fetchMock
      .mockResolvedValueOnce(matching())
      .mockResolvedValueOnce(status(500));
    const restoring = h.onChange?.(user);
    await vi.waitFor(() => expect(subscribe).toHaveBeenCalled());
    expect(await logout()).toBe(false);
    account.resolve();
    await restoring;
    expect(sessionState.get()).toBe('error');
    expect(initSubscriberStore).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(matching());
    await h.onChange?.(user);
    expect(sessionState.get()).toBe('active');
    expect(uid.get()).toBe('A');
  });

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
