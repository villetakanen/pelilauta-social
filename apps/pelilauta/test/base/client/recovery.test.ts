import type { User } from 'firebase/auth';
import { beforeEach, expect, test, vi } from 'vitest';
import {
  createRecovery,
  recoveryAttemptKey,
} from '../../../src/base/client/login/recovery';
import {
  beginCookieSession,
  blockCookieSynchronization,
  resumeCookieSynchronization,
} from '../../../src/utils/client/sessionCookie';

const user = {
  uid: 'A',
  getIdToken: vi.fn(async () => 'token-A'),
} as unknown as User;
const destination = '/settings?view=list&redirect=%2Finbox#latest';
const fetchMock = vi.fn();
const report = vi.fn();
const navigate = vi.fn();
const logout = vi.fn(async () => true);
const resolveUser = vi.fn<() => Promise<User | null>>(async () => user);
const stored = new Map<string, string>();
const storage = {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => {
    stored.set(key, value);
  },
};
const response = (status: number, body = '') => new Response(body, { status });
const matching = () =>
  response(200, JSON.stringify({ uid: 'A', expiresAt: 1900000000 }));
function controller(selectedStorage = storage) {
  return createRecovery({
    destination,
    storage: selectedStorage,
    report,
    navigate,
    logout,
    resolveUser,
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}

beforeEach(async () => {
  await blockCookieSynchronization();
  resumeCookieSynchronization();
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  stored.clear();
  logout.mockResolvedValue(true);
  resolveUser.mockResolvedValue(user);
});

test('repair navigates once and suppresses repeated recovery across visits and fragments', async () => {
  fetchMock
    .mockResolvedValueOnce(response(401))
    .mockResolvedValueOnce(response(200));
  await controller().attempt(true);
  expect(navigate).toHaveBeenCalledExactlyOnceWith(destination);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(stored.get(recoveryAttemptKey(destination))).toBe('1');
  const repeated = createRecovery({
    destination: destination.replace('#latest', '#other'),
    storage,
    report,
    navigate,
    logout,
    resolveUser,
  });
  await repeated.attempt(true);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(report).toHaveBeenLastCalledWith('retry');
  fetchMock.mockResolvedValueOnce(matching());
  await repeated.attempt();
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(navigate).toHaveBeenCalledTimes(2);
});

test('unavailable tab storage requires explicit retry', async () => {
  const recovery = controller({
    getItem: () => {
      throw new Error('disabled');
    },
    setItem: () => {
      throw new Error('disabled');
    },
  });
  await recovery.attempt(true);
  expect(resolveUser).not.toHaveBeenCalled();
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(matching());
  await recovery.attempt();
  expect(navigate).toHaveBeenCalledExactlyOnceWith(destination);
});

test('no Firebase user offers sign-in without cookie requests or navigation', async () => {
  resolveUser.mockResolvedValueOnce(null);
  await controller().attempt(true);
  expect(report).toHaveBeenLastCalledWith('signedOut');
  expect(fetchMock).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
});

test.each([500, 503, 200])(
  'inconclusive status %i retains authentication and offers retry',
  async (status) => {
    fetchMock.mockResolvedValueOnce(response(status, '{}'));
    const recovery = controller();
    await recovery.attempt(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(report).toHaveBeenLastCalledWith('unavailable');
    fetchMock.mockResolvedValueOnce(matching());
    await recovery.attempt();
    expect(navigate).toHaveBeenCalledExactlyOnceWith(destination);
  },
);

test.each([true, false])(
  'rejected repair reports logout outcome %s',
  async (success) => {
    logout.mockResolvedValueOnce(success);
    fetchMock
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(401));
    await controller().attempt(true);
    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(report).toHaveBeenLastCalledWith(
      success ? 'failed' : 'logoutIncomplete',
    );
  },
);

test.each([500, 503])(
  'temporary repair failure %i retains authentication',
  async (status) => {
    fetchMock
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(status));
    await controller().attempt(true);
    expect(logout).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(report).toHaveBeenLastCalledWith('unavailable');
  },
);

test('retry during a stalled exchange shares the attempt until it settles', async () => {
  const post = deferred<Response>();
  fetchMock
    .mockResolvedValueOnce(response(401))
    .mockReturnValueOnce(post.promise);
  const recovery = controller();
  const first = recovery.attempt(true);
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const retry = recovery.attempt();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  post.resolve(response(503));
  await Promise.all([first, retry]);
  expect(navigate).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(matching());
  await recovery.attempt();
  expect(navigate).toHaveBeenCalledExactlyOnceWith(destination);
});

test.each(['identity replacement', 'logout', 'interactive sign-in', 'dispose'])(
  '%s supersedes a pending repair',
  async (action) => {
    const post = deferred<Response>();
    fetchMock
      .mockResolvedValueOnce(response(401))
      .mockReturnValueOnce(post.promise);
    const recovery = controller();
    const restoring = recovery.attempt(true);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    let leaving: Promise<void> | undefined;
    if (action === 'identity replacement') beginCookieSession('B');
    if (action === 'logout') leaving = blockCookieSynchronization();
    if (action === 'interactive sign-in') recovery.cancel();
    if (action === 'dispose') recovery.dispose();
    post.resolve(response(200));
    await restoring;
    await leaving;
    expect(navigate).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  },
);

test('interactive sign-in during a status check dispatches no obsolete repair', async () => {
  const get = deferred<Response>();
  fetchMock.mockReturnValueOnce(get.promise);
  const recovery = controller();
  const restoring = recovery.attempt(true);
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  recovery.cancel();
  get.resolve(response(401));
  await restoring;
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(navigate).not.toHaveBeenCalled();
});

test('disposal during Firebase initialization dispatches no requests', async () => {
  const userPending = deferred<User | null>();
  resolveUser.mockReturnValueOnce(userPending.promise);
  const recovery = controller();
  const restoring = recovery.attempt(true);
  recovery.dispose();
  userPending.resolve(user);
  await restoring;
  expect(fetchMock).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
});
