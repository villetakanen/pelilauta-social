import { atom } from 'nanostores';
import { beforeEach, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  unsubscribe: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  snapshots: [] as Array<(snapshot: unknown) => Promise<void>>,
}));
vi.mock('../../src/stores/session', () => ({ uid: atom('') }));
vi.mock('../../src/stores/session/computed', () => ({
  isResolvedActive: atom(false),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  doc: (_db: unknown, _collection: string, key: string) => key,
  onSnapshot: h.onSnapshot,
  setDoc: h.setDoc,
  updateDoc: h.updateDoc,
}));

const { uid } = await import('../../src/stores/session');
const { isResolvedActive } = await import('../../src/stores/session/computed');
const active = isResolvedActive as ReturnType<typeof atom<boolean>>;
const { subscription, setSeen } = await import('../../src/stores/subscription');
const { createSubscription } = await import(
  '../../src/schemas/SubscriberSchema'
);
const snapshot = (reader: string) => ({
  exists: () => true,
  data: () => createSubscription(reader),
});

beforeEach(() => {
  active.set(false);
  uid.set('');
  h.onSnapshot.mockReset().mockImplementation((_ref, callback) => {
    h.snapshots.push(callback);
    return h.unsubscribe;
  });
  h.unsubscribe.mockClear();
  h.setDoc.mockReset();
  h.updateDoc.mockReset();
  h.snapshots.length = 0;
});

test('a saved UID starts no read-state listener or writes', async () => {
  uid.set('A');
  await setSeen('thread');
  expect(h.onSnapshot).not.toHaveBeenCalled();
  expect(h.updateDoc).not.toHaveBeenCalled();
  active.set(true);
  await vi.waitFor(() => expect(h.onSnapshot).toHaveBeenCalledTimes(1));
  expect(h.onSnapshot).toHaveBeenCalledWith(
    'A',
    expect.any(Function),
    expect.any(Function),
  );
});

test('a superseded listener setup starts no subscription', async () => {
  uid.set('A');
  active.set(true);
  active.set(false);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(h.onSnapshot).not.toHaveBeenCalled();
});

test('account replacement detaches the old listener and rejects late snapshots', async () => {
  uid.set('A');
  active.set(true);
  await vi.waitFor(() => expect(h.snapshots).toHaveLength(1));
  await h.snapshots[0](snapshot('A'));
  expect(subscription.get()?.uid).toBe('A');
  uid.set('B');
  expect(subscription.get()).toBeNull();
  await vi.waitFor(() => expect(h.snapshots).toHaveLength(2));
  expect(h.unsubscribe).toHaveBeenCalledTimes(1);
  await h.snapshots[1](snapshot('B'));
  await h.snapshots[0](snapshot('A'));
  expect(subscription.get()?.uid).toBe('B');
});

test('incomplete logout retains local read state until UID cleanup', async () => {
  uid.set('A');
  active.set(true);
  await vi.waitFor(() => expect(h.snapshots).toHaveLength(1));
  await h.snapshots[0](snapshot('A'));
  active.set(false);
  expect(subscription.get()?.uid).toBe('A');
  uid.set('');
  expect(subscription.get()).toBeNull();
});

test('loss of agreement prevents pending missing-document creation and mark-read writes', async () => {
  uid.set('A');
  active.set(true);
  await vi.waitFor(() => expect(h.snapshots).toHaveLength(1));
  const creating = h.snapshots[0]({ exists: () => false });
  const marking = setSeen('thread');
  active.set(false);
  await Promise.all([creating, marking]);
  expect(h.setDoc).not.toHaveBeenCalled();
  expect(h.updateDoc).not.toHaveBeenCalled();
  expect(subscription.get()).toBeNull();
});
