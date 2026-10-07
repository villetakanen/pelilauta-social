import { atom, cleanStores } from 'nanostores';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const firebase = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  where: vi.fn(),
}));

vi.mock('@pelilauta/stores/session', () => ({ uid: atom('') }));
vi.mock('@pelilauta/stores/session/computed', () => ({
  isResolvedActive: atom(false),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  ...firebase,
}));

import { uid } from '@pelilauta/stores/session';
import { isResolvedActive } from '@pelilauta/stores/session/computed';
import {
  newCount,
  notifications,
} from '../../../../src/library/client/inbox/inboxStore';

const resolved = isResolvedActive as ReturnType<typeof atom<boolean>>;
const snapshot = (to: string) => ({
  docs: [
    {
      id: `note-${to}`,
      metadata: { hasPendingWrites: false },
      data: () => ({
        to,
        from: 'author',
        targetKey: 'thread',
        targetType: 'thread.reply',
        targetTitle: `For ${to}`,
        createdAt: new Date(),
        read: false,
      }),
    },
  ],
});

let stop: () => void;
const unsubscribers: ReturnType<typeof vi.fn>[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  uid.set('');
  resolved.set(false);
  unsubscribers.length = 0;
  firebase.onSnapshot.mockImplementation(() => {
    const unsubscribe = vi.fn();
    unsubscribers.push(unsubscribe);
    return unsubscribe;
  });
  vi.stubGlobal('window', { localStorage: { removeItem: vi.fn() } });
  stop = notifications.subscribe(() => {});
});

afterEach(() => {
  stop();
  cleanStores(notifications, newCount);
  vi.unstubAllGlobals();
});

describe('inbox recipient lifecycle', () => {
  it('waits for resolution and clears the inbox across logout and another login', async () => {
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(
      'notifications',
    );
    uid.set('A');
    await Promise.resolve();
    expect(firebase.onSnapshot).not.toHaveBeenCalled();
    resolved.set(true);
    await vi.waitFor(() =>
      expect(firebase.onSnapshot).toHaveBeenCalledTimes(1),
    );
    const receiveA = firebase.onSnapshot.mock.calls[0][2];
    receiveA(snapshot('A'));
    expect(newCount.get()).toBe(1);

    resolved.set(false);
    expect(notifications.get()).toEqual([]);
    expect(newCount.get()).toBe(0);
    expect(unsubscribers[0]).toHaveBeenCalledOnce();
    receiveA(snapshot('A'));
    expect(notifications.get()).toEqual([]);

    uid.set('B');
    resolved.set(true);
    await vi.waitFor(() =>
      expect(firebase.onSnapshot).toHaveBeenCalledTimes(2),
    );
    firebase.onSnapshot.mock.calls[1][2](snapshot('B'));
    receiveA(snapshot('A'));
    expect(notifications.get().map((note) => note.to)).toEqual(['B']);
    expect(firebase.where).toHaveBeenLastCalledWith('to', '==', 'B');
  });

  it('counts acknowledgment only after the write succeeds', async () => {
    uid.set('A');
    resolved.set(true);
    await vi.waitFor(() => expect(firebase.onSnapshot).toHaveBeenCalledOnce());
    const receive = firebase.onSnapshot.mock.calls[0][2];
    receive(snapshot('A'));
    const pending = snapshot('A');
    pending.docs[0].metadata.hasPendingWrites = true;
    pending.docs[0].data = () => ({
      ...snapshot('A').docs[0].data(),
      read: true,
    });
    receive(pending);
    expect(newCount.get()).toBe(1);
    receive(snapshot('A'));
    expect(newCount.get()).toBe(1);
    pending.docs[0].metadata.hasPendingWrites = false;
    receive(pending);
    expect(newCount.get()).toBe(0);
  });

  it('abandons a pending subscription when the reader signs out', async () => {
    uid.set('A');
    resolved.set(true);
    resolved.set(false);
    await vi.dynamicImportSettled();
    expect(firebase.onSnapshot).not.toHaveBeenCalled();
    expect(firebase.where).not.toHaveBeenCalled();
  });

  it('replaces an active recipient without an intervening logout', async () => {
    uid.set('A');
    resolved.set(true);
    await vi.waitFor(() =>
      expect(firebase.onSnapshot).toHaveBeenCalledTimes(1),
    );
    const receiveA = firebase.onSnapshot.mock.calls[0][2];
    receiveA(snapshot('A'));
    uid.set('B');
    expect(notifications.get()).toEqual([]);
    expect(unsubscribers[0]).toHaveBeenCalledOnce();
    await vi.waitFor(() =>
      expect(firebase.onSnapshot).toHaveBeenCalledTimes(2),
    );
    firebase.onSnapshot.mock.calls[1][2](snapshot('B'));
    receiveA(snapshot('A'));
    expect(notifications.get().map((note) => note.to)).toEqual(['B']);
  });

  it('ignores callbacks after the store stops', async () => {
    uid.set('A');
    resolved.set(true);
    await vi.waitFor(() =>
      expect(firebase.onSnapshot).toHaveBeenCalledTimes(1),
    );
    const receive = firebase.onSnapshot.mock.calls[0][2];
    receive(snapshot('A'));
    cleanStores(notifications);
    receive(snapshot('A'));
    expect(notifications.get()).toEqual([]);
    expect(unsubscribers[0]).toHaveBeenCalledOnce();
  });
});
