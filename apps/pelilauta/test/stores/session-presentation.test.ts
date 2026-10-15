import type { User } from 'firebase/auth';
import { atom } from 'nanostores';
import { beforeEach, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({
  onChange: undefined as ((user: User | null) => Promise<void>) | undefined,
  snapshots: [] as Array<(snapshot: unknown) => void>,
  unsubscribe: vi.fn(),
}));

vi.mock('@firebase/client', () => ({
  db: {},
  auth: {
    onAuthStateChanged: (callback: typeof h.onChange) => {
      h.onChange = callback;
    },
  },
}));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, _collection: string, key: string) => key,
  onSnapshot: (_ref: unknown, callback: (snapshot: unknown) => void) => {
    h.snapshots.push(callback);
    return h.unsubscribe;
  },
}));
vi.mock('../../src/stores/metaStore/metaStore', () => ({
  appMeta: atom({ admins: ['A'] }),
}));
vi.mock('../../src/stores/session/account', () => ({
  $account: atom<{ uid: string } | null>(null),
  subscribe: vi.fn(),
  reset: vi.fn(),
}));
vi.mock('../../src/stores/session/subscriber', () => ({
  initSubscriberStore: vi.fn(),
  resetSubscriberStore: vi.fn(),
}));
vi.mock('@utils/client/snackUtils', () => ({
  pushSnack: vi.fn(),
  pushSessionSnack: vi.fn(),
}));
vi.stubGlobal('window', {
  addEventListener: () => {},
  removeEventListener: () => {},
});

const { authUser, sessionState, uid, showAdminTools } = await import(
  '../../src/stores/session'
);
const { $account } = await import('../../src/stores/session/account');
const { $profile, $profileMissing, unsubscribeFromProfile } = await import(
  '../../src/stores/session/profile'
);
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const user = (key: string) => ({ uid: key }) as User;
const matching = (key: string) =>
  new Response(JSON.stringify({ uid: key, expiresAt: 1900000000 }));
const snapshot = (key: string, exists = true) => ({
  id: key,
  exists: () => exists,
  data: () => ({
    nick: `Reader ${key}`,
    avatarURL: `https://example.com/${key}.png`,
  }),
});

beforeEach(() => {
  unsubscribeFromProfile();
  h.snapshots.length = 0;
  h.unsubscribe.mockClear();
  fetchMock.mockReset();
  sessionState.set('initial');
  uid.set('');
  authUser.set(null);
  $account.set(null);
});

test.each(['initial', 'loading', 'error'] as const)(
  'a saved administrator account enables no tools in %s',
  (state) => {
    uid.set('A');
    authUser.set(user('A'));
    $account.set({ uid: 'A', eulaAccepted: true });
    sessionState.set(state);
    expect(showAdminTools.get()).toBe(false);
  },
);

test('administrative presentation requires matching verified account data', () => {
  uid.set('A');
  $account.set({ uid: 'A', eulaAccepted: true });
  sessionState.set('active');
  expect(showAdminTools.get()).toBe(false);
  authUser.set(user('A'));
  expect(showAdminTools.get()).toBe(true);
  authUser.set(user('B'));
  expect(showAdminTools.get()).toBe(false);
  uid.set('B');
  expect(showAdminTools.get()).toBe(false);
  $account.set({ uid: 'B', eulaAccepted: true });
  expect(showAdminTools.get()).toBe(false);
});

test('replacement verifies without waiting for its profile and discards the previous profile', async () => {
  fetchMock.mockResolvedValueOnce(matching('A'));
  await h.onChange?.(user('A'));
  h.snapshots[0](snapshot('A'));
  expect($profile.get()?.nick).toBe('Reader A');

  fetchMock.mockResolvedValueOnce(matching('B'));
  await h.onChange?.(user('B'));
  expect(sessionState.get()).toBe('active');
  expect(uid.get()).toBe('B');
  expect($profile.get()).toBeNull();
  expect($profileMissing.get()).toBe(false);
  expect(h.unsubscribe).toHaveBeenCalledTimes(1);

  h.snapshots[0](snapshot('A'));
  expect($profile.get()).toBeNull();
  h.snapshots[1](snapshot('B', false));
  expect($profile.get()).toBeNull();
  expect($profileMissing.get()).toBe(true);

  h.snapshots[1](snapshot('B'));
  expect($profile.get()?.nick).toBe('Reader B');
  expect($profileMissing.get()).toBe(false);
  h.snapshots[1](snapshot('B', false));
  expect($profile.get()).toBeNull();
  expect($profileMissing.get()).toBe(true);
});
