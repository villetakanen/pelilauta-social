import { atom } from 'nanostores';
import { beforeEach, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({ getDocs: vi.fn() }));
vi.mock('../../src/stores/session', () => ({ uid: atom('') }));
vi.mock('../../src/stores/session/computed', () => ({
  isResolvedActive: atom(false),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  collection: () => 'sites',
  where: (field: string, _operator: string, value: string) => ({
    field,
    value,
  }),
  query: (_collection: unknown, filter: unknown) => filter,
  getDocs: h.getDocs,
}));

const { uid } = await import('../../src/stores/session');
const { isResolvedActive } = await import('../../src/stores/session/computed');
const active = isResolvedActive as ReturnType<typeof atom<boolean>>;
const { userSites } = await import('../../src/stores/userSites');

function deferred() {
  let resolve!: (value: unknown) => void;
  const promise = new Promise((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
const docs = (reader: string) => ({
  docs: [
    {
      id: `site-${reader}`,
      data: () => ({ name: `Site ${reader}`, owners: [reader], flowTime: 1 }),
    },
  ],
});

beforeEach(() => {
  active.set(false);
  uid.set('');
  h.getDocs.mockReset();
});

test('a saved UID starts no library queries before verification', async () => {
  uid.set('A');
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(h.getDocs).not.toHaveBeenCalled();
  h.getDocs.mockResolvedValue({ docs: [] });
  active.set(true);
  await vi.waitFor(() => expect(h.getDocs).toHaveBeenCalledTimes(2));
  expect(h.getDocs).toHaveBeenCalledWith({ field: 'owners', value: 'A' });
  expect(h.getDocs).toHaveBeenCalledWith({ field: 'players', value: 'A' });
});

test('late library queries cannot restore the previous reader sites', async () => {
  const previous = deferred();
  h.getDocs.mockReturnValue(previous.promise);
  uid.set('A');
  active.set(true);
  await vi.waitFor(() => expect(h.getDocs).toHaveBeenCalledTimes(2));

  h.getDocs.mockResolvedValue(docs('B'));
  uid.set('B');
  await vi.waitFor(() =>
    expect(userSites.get().map((site) => site.key)).toEqual(['site-B']),
  );
  previous.resolve(docs('A'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(userSites.get().map((site) => site.key)).toEqual(['site-B']);
});

test('loss of session agreement discards pending library results', async () => {
  const pending = deferred();
  h.getDocs.mockReturnValue(pending.promise);
  uid.set('A');
  active.set(true);
  await vi.waitFor(() => expect(h.getDocs).toHaveBeenCalledTimes(2));
  active.set(false);
  pending.resolve(docs('A'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(userSites.get()).toEqual([]);
});

test('incomplete logout retains the local library cache until UID cleanup', async () => {
  uid.set('A');
  h.getDocs.mockResolvedValue(docs('A'));
  active.set(true);
  await vi.waitFor(() => expect(userSites.get()).toHaveLength(1));
  active.set(false);
  expect(userSites.get().map((site) => site.key)).toEqual(['site-A']);
  uid.set('');
  expect(userSites.get()).toEqual([]);
});
