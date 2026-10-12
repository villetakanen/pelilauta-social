/**
 * Unit tests for the thread send functions' wait for the restored session.
 *
 * Firebase restores a persisted user asynchronously; a send racing the restore
 * must wait for it instead of failing a signed-in user.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  currentUser: null as null | { getIdToken: () => Promise<string> },
  authStateReady: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/auth', () => ({ getAuth: () => auth }));
vi.mock('../../../src/firebase/client', () => ({ app: {} }));
vi.mock('../../../src/utils/logHelpers', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

import { createThreadApi } from '../../../src/firebase/client/threads/createThreadApi';
import { submitReply } from '../../../src/firebase/client/threads/submitReply';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  auth.currentUser = null;
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true, threadKey: 't1', replyId: 'r1' }),
  });
});

const thread = { key: 't1' } as Parameters<typeof submitReply>[0];

describe('thread sends while the session restores', () => {
  it('waits for the session and sends the bearer token', async () => {
    auth.authStateReady.mockImplementation(async () => {
      auth.currentUser = { getIdToken: async () => 'restored-token' };
    });

    await submitReply(thread, 'hello');
    await createThreadApi({ title: 'T', channel: 'c' }, []);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init.headers.Authorization).toBe('Bearer restored-token');
    }
  });

  it('throws and does not fetch when no user is restored', async () => {
    auth.authStateReady.mockResolvedValue(undefined);

    await expect(submitReply(thread, 'hello')).rejects.toThrow(
      'User not authenticated',
    );
    await expect(createThreadApi({ title: 'T' }, [])).rejects.toThrow(
      'User not authenticated',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
