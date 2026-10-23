import { auth } from '@firebase/client';
import { pushSnack } from '@utils/client/snackUtils';
import { logDebug, logError, logWarn } from '@utils/logHelpers';
import type { User } from 'firebase/auth';
import { computed } from 'nanostores';
import { appMeta } from 'src/stores/metaStore/metaStore';
import {
  beginCookieSession,
  reconcileSessionCookie,
} from 'src/utils/client/sessionCookie';
import { $account, subscribe as subscribeToAccount } from './account';
import { logout } from './logout';
import { subscribeToProfile } from './profile';
import {
  authUser,
  markSessionManagerStarted,
  sessionState,
  uid,
} from './state';
import { initSubscriberStore } from './subscriber';

export { logout } from './logout';
export { authUser, type SessionState, sessionState, uid } from './state';

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
  markSessionManagerStarted();
  auth.onAuthStateChanged(handleFirebaseAuthChange);
  logDebug('sessionStore', 'Subscribed to auth state changes');
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
  // Each Firebase resolution requires current server agreement.
  if (user && sessionState.get() === 'active') {
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
  const status = await reconcileSessionCookie(user, identityCurrent);
  if (!current() || status === 'superseded') return;
  if (status === 'unavailable') {
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
    if (status === 'rejected') {
      throw new Error('Session credentials rejected');
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

export * from './account';
export * from './subscriber';
// Exporting from './computed' here creates a circular dependency.
// Import computed helpers directly: import { isActive, isRehydrating, isAnonymous } from 'src/stores/session/computed';
