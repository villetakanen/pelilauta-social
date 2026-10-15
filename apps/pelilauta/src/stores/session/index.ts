import { auth } from '@firebase/client';
import { persistentAtom } from '@nanostores/persistent';
import { pushSessionSnack, pushSnack } from '@utils/client/snackUtils';
import { logDebug, logError, logWarn } from '@utils/logHelpers';
import type { User } from 'firebase/auth';
import { atom, computed } from 'nanostores';
import { appMeta } from 'src/stores/metaStore/metaStore';
import {
  beginCookieSession,
  blockCookieSynchronization,
  resumeCookieSynchronization,
  synchronizeSessionCookie,
  waitForCookieSynchronization,
} from 'src/utils/client/sessionCookie';
import {
  $account,
  subscribe as subscribeToAccount,
  reset as unsubscribeFromAccount,
} from './account';
import { subscribeToProfile, unsubscribeFromProfile } from './profile';
import { initSubscriberStore, resetSubscriberStore } from './subscriber';

export const authUser = atom<User | null>(null);

export type SessionState = 'initial' | 'loading' | 'active' | 'error';
// Every page load starts at `initial`. Only this page's verification against the server session moves the state to `active`.
export const sessionState = atom<SessionState>('initial');

sessionState.subscribe((state, oldState) => {
  if (state !== oldState) {
    logDebug('sessionStore', 'sessionState changed', {
      from: oldState,
      to: state,
    });
  }
});

export const uid = persistentAtom<string>('session-uid', '');

if (typeof document !== 'undefined') {
  uid.subscribe((value) => {
    document.documentElement.classList.toggle(
      'has-session-uid',
      Boolean(value),
    );
  });
}

export const active = computed(sessionState, (state) => state === 'active');

// This gate controls presentation only. Server authorization remains independent.
export const showAdminTools = computed(
  [sessionState, uid, authUser, $account, appMeta],
  (state, currentUid, user, account, meta) =>
    state === 'active' &&
    currentUid !== '' &&
    user?.uid === currentUid &&
    account?.uid === currentUid &&
    Boolean(meta?.admins?.includes(currentUid)),
);

export const anonymous = computed([active, uid], (active, uid) => {
  if (!active) return false;
  return !uid;
});
// Solid components use $isAnonymous as a legacy alias.
export const $isAnonymous = anonymous;

export const $locale = computed(
  $account,
  (account) => account?.language || 'fi',
);
export const $theme = computed(
  $account,
  (account) => account?.lightMode || 'dark',
);

export { $profile, $profileMissing } from './profile';

/*
 * The authentication listener attaches on module load. Subscribing to `uid`
 * during module evaluation mounts the store before an `onMount` hook can arm,
 * preventing hook execution on subsequent listeners.
 */
if (typeof window !== 'undefined') {
  auth.onAuthStateChanged(handleFirebaseAuthChange);
  logDebug('sessionStore', 'Subscribed to auth state changes');
}

/**
 * This function compares the server session cookie with the resolved Firebase user.
 * Only HTTP 401 or a response containing another UID requires repair. Other mismatches
 * leave agreement unconfirmed.
 */
async function getServerSessionStatus(
  userUid: string,
): Promise<'match' | 'repair' | 'inconclusive'> {
  try {
    const response = await fetch('/api/auth/session');
    if (response.status === 401) return 'repair';
    if (response.status !== 200) return 'inconclusive';
    const body = await response.json();
    if (
      typeof body?.uid !== 'string' ||
      !body.uid ||
      !Number.isInteger(body.expiresAt)
    ) {
      return 'inconclusive';
    }
    return body.uid === userUid ? 'match' : 'repair';
  } catch (error) {
    logWarn('sessionStore', 'Failed to check server session:', error);
    return 'inconclusive';
  }
}

let reconciliation = 0;

async function handleFirebaseAuthChange(user: User | null) {
  const started = ++reconciliation;
  const identityCurrent = beginCookieSession(user?.uid ?? null);
  const current = () => identityCurrent() && started === reconciliation;
  logDebug('sessionStore', 'handleFirebaseAuthChange', {
    user: !!user,
    currentState: sessionState.get(),
    currentUid: uid.get(),
  });
  authUser.set(user);
  // A replacement identity invalidates the verification of the previous one.
  if (user && sessionState.get() === 'active' && uid.get() !== user.uid) {
    sessionState.set('initial');
  }

  // Unauthenticated state requires cleanup when the session is not initial. Concurrent calls share the running logout operation.
  if (!user) {
    if (sessionState.get() !== 'initial') {
      await logout();
    }
    return;
  }

  // Persisted session state cannot substitute for server verification. Every resolved user requires verification against the session cookie.
  if (!current()) return;
  await waitForCookieSynchronization();
  if (!current()) return;
  const status = await getServerSessionStatus(user.uid);
  if (!current()) return;
  if (status === 'inconclusive') {
    // Agreement remains unconfirmed. Firebase authentication and persisted identity remain for subsequent verification.
    logWarn(
      'sessionStore',
      'handleFirebaseAuthChange',
      'Server session check inconclusive. Not confirming session.',
    );
    sessionState.set('error');
    return;
  }

  try {
    if (status === 'repair') {
      sessionState.set('loading');
      let postStatus = 0;
      try {
        const response = await synchronizeSessionCookie(user, identityCurrent);
        postStatus = response.status;
      } catch (error) {
        logWarn('sessionStore', 'Failed to post session token:', error);
      }

      if (!current()) return;
      if (postStatus === 401) {
        throw new Error('Session credentials rejected');
      }
      if (postStatus !== 200) {
        // Transport failures and HTTP 5xx responses represent temporary errors. Subsequent checks retry repair.
        logWarn(
          'sessionStore',
          'handleFirebaseAuthChange',
          'Session repair failed temporarily. Not confirming session.',
        );
        sessionState.set('error');
        return;
      }
    }

    // The session subscribes to account and profile documents even when either document is absent.
    try {
      await subscribeToAccount(user.uid, current);
    } catch (error) {
      logError('sessionStore', 'Failed to subscribe to account:', error);
    }

    if (!current()) return;
    try {
      subscribeToProfile(user.uid, current);
    } catch (error) {
      logError('sessionStore', 'Failed to subscribe to profile:', error);
    }

    await login(user.uid, current);
    if (!current()) return;

    sessionState.set('active');
    logDebug(
      'sessionStore',
      'handleFirebaseAuthChange',
      'User logged in and session is active',
    );
  } catch (error) {
    if (!current()) return;
    logWarn(
      'sessionStore',
      'handleFirebaseAuthChange',
      'Error during login process',
      error,
    );
    sessionState.set('error');
    pushSnack('app.login.error.firebase');
    await logout();
  }
}

async function login(newUid: string, current: () => boolean) {
  if (!newUid) {
    logWarn('sessionStore', 'login', 'No uid provided');
    return;
  }
  uid.set(newUid);

  await initSubscriberStore(newUid, current);
}

async function clear() {
  logDebug('sessionStore', 'clear', 'Clearing session data');
  uid.set('');
  resetSubscriberStore();
  unsubscribeFromAccount();
  unsubscribeFromProfile();
}

let logoutInProgress: Promise<boolean> | undefined;

/**
 * Logout deletes the session cookie first, clears local user data second, and
 * signs out of Firebase last. A failed step halts subsequent steps, sets state
 * to error, and notifies the reader. Concurrent callers share the active logout
 * operation. The operation resolves to true on completion and false on failure,
 * and never rejects.
 */
export function logout(): Promise<boolean> {
  if (!logoutInProgress) {
    logoutInProgress = runLogout().finally(() => {
      resumeCookieSynchronization();
      logoutInProgress = undefined;
    });
  }
  return logoutInProgress;
}

async function runLogout(): Promise<boolean> {
  logDebug('sessionStore', 'logout', 'Starting logout process');
  sessionState.set('loading');

  try {
    await blockCookieSynchronization();
    const response = await fetch('/api/auth/session', { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`Session cookie deletion failed: ${response.status}`);
    }
    await clear();
    await auth.signOut();
  } catch (error) {
    logError('sessionStore', 'logout', 'Logout did not complete', error);
    sessionState.set('error');
    try {
      pushSessionSnack('snack:session.logoutIncomplete');
    } catch (snackError) {
      logWarn('sessionStore', 'logout', 'Could not notify reader', snackError);
    }
    return false;
  }

  sessionState.set('initial');
  logDebug('sessionStore', 'logout', 'Logout complete');
  return true;
}

export * from './account';
export * from './subscriber';
// Exporting from './computed' here creates a circular dependency.
// Import computed helpers directly: import { isActive, isRehydrating, isAnonymous } from 'src/stores/session/computed';
