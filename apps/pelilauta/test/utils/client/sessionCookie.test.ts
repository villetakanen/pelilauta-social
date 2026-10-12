import type { User } from 'firebase/auth';
import { beforeEach, expect, test, vi } from 'vitest';
import {
  beginCookieSession,
  blockCookieSynchronization,
  resumeCookieSynchronization,
  synchronizeSessionCookie,
} from '../../../src/utils/client/sessionCookie';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const user = (uid: string) =>
  ({ uid, getIdToken: vi.fn(async () => `token-${uid}`) }) as unknown as User;
const fetchMock = vi.fn();

beforeEach(async () => {
  await blockCookieSynchronization();
  resumeCookieSynchronization();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

test('same-identity callers share creation and can both read the response', async () => {
  const post = deferred<Response>();
  fetchMock.mockReturnValue(post.promise);
  const a = user('A');
  const first = synchronizeSessionCookie(a, beginCookieSession('A'));
  const second = synchronizeSessionCookie(a, beginCookieSession('A'));
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  post.resolve(new Response('no', { status: 401 }));
  const [one, two] = await Promise.all([first, second]);
  expect(await one.text()).toBe('no');
  expect(await two.text()).toBe('no');
  expect(a.getIdToken).toHaveBeenCalledTimes(1);
});

test('logout waits for a dispatched POST and rejects new creation', async () => {
  const post = deferred<Response>();
  fetchMock.mockReturnValue(post.promise);
  const current = beginCookieSession('A');
  const creation = synchronizeSessionCookie(user('A'), current);
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  let settled = false;
  const logout = blockCookieSynchronization().then(() => {
    settled = true;
  });
  expect(current()).toBe(false);
  await expect(
    synchronizeSessionCookie(user('A'), beginCookieSession('A')),
  ).rejects.toThrow('superseded');
  expect(settled).toBe(false);
  post.resolve(new Response('', { status: 200 }));
  await Promise.all([creation, logout]);
  expect(settled).toBe(true);
  resumeCookieSynchronization();
  expect(current()).toBe(false);
});

test('an identity change orders its POST after the previous dispatched POST', async () => {
  const post = deferred<Response>();
  fetchMock
    .mockReturnValueOnce(post.promise)
    .mockResolvedValue(new Response('', { status: 200 }));
  const aCurrent = beginCookieSession('A');
  const first = synchronizeSessionCookie(user('A'), aCurrent);
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  const second = synchronizeSessionCookie(user('B'), beginCookieSession('B'));
  expect(aCurrent()).toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  post.resolve(new Response('', { status: 200 }));
  await Promise.all([first, second]);
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
    token: 'token-B',
  });
});

test('a late failed POST does not prevent logout from proceeding', async () => {
  const post = deferred<Response>();
  fetchMock.mockReturnValue(post.promise);
  const creation = synchronizeSessionCookie(user('A'), beginCookieSession('A'));
  const rejected = expect(creation).rejects.toThrow('offline');
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  const logout = blockCookieSynchronization();
  post.reject(new TypeError('offline'));
  await rejected;
  await logout;
});

test('logout during token acquisition sends no POST', async () => {
  const token = deferred<string>();
  const a = user('A');
  vi.mocked(a.getIdToken).mockReturnValue(token.promise);
  const creation = synchronizeSessionCookie(a, beginCookieSession('A'));
  const rejected = expect(creation).rejects.toThrow('superseded');
  await vi.waitFor(() => expect(a.getIdToken).toHaveBeenCalled());
  const logout = blockCookieSynchronization();
  token.resolve('token-A');
  await rejected;
  await logout;
  expect(fetchMock).not.toHaveBeenCalled();
});
