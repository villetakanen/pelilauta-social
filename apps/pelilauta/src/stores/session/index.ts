import { auth } from '@firebase/client';
import { persistentAtom } from '@nanostores/persistent';
import { pushSnack } from '@utils/client/snackUtils';
import { logDebug, logError, logWarn } from '@utils/logHelpers';
import type { User } from 'firebase/auth';
import { atom, computed } from 'nanostores';
import {
  $account,
  subscribe as subscribeToAccount,
  reset as unsubscribeFromAccount,
} from './account';
import { subscribeToProfile, unsubscribeFromProfile } from './profile';
import { initSubscriberStore } from './subscriber';

// Firebase auth user - reactive store for the current Firebase user
export const authUser = atom<User | null>(null);

// *** Primary session stores ******************************************

export type SessionState = 'initial' | 'loading' | 'active' | 'error';
// Session state - used to determine if the session is active for UX purposes
export const sessionState = persistentAtom<SessionState>(
  'session-state',
  'initial',
);

// Fix for infinite loading state:
// If the page was reloaded while in 'loading' state, we need to reset it
// because the async process that was supposed to clear it is no longer running.
if (sessionState.get() === 'loading') {
  sessionState.set('initial');
}

// Add debug logging for session state changes
sessionState.subscribe((state, oldState) => {
  if (state !== oldState) {
    logDebug('sessionStore', 'sessionState changed', {
      from: oldState,
      to: state,
    });
  }
});

// Legacy support for solid components
export const $loadingState = sessionState;

// Active user's UID, stored in localStorage for session persistence
export const uid = persistentAtom<string>('session-uid', '');

if (typeof document !== 'undefined') {
  uid.subscribe((value) => {
    document.documentElement.classList.toggle(
      'has-session-uid',
      Boolean(value),
    );
  });
}

// *** Computed stores ******************************************

// Helper for the session state
export const active = computed(sessionState, (state) => state === 'active');

// Helper to identify anonymous session for UX purposes
export const anonymous = computed([active, uid], (active, uid) => {
  if (!active) return false;
  return !uid;
});
// Legacy support for solid components
export const $isAnonymous = anonymous;

// *** REFACTORED UP TO HERE ******************************************

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
 * The browser learns who the reader is here, and nowhere else. A store mount
 * hook would have missed it: the class toggle above subscribes to `uid` as this
 * module loads, so the store is mounted before a hook could arm, and the hook
 * fires on the first listener alone. The listener is attached on load instead,
 * which no import order can silence.
 */
if (typeof window !== 'undefined') {
  auth.onAuthStateChanged(handleFirebaseAuthChange);
  logDebug('sessionStore', 'Subscribed to auth state changes');
}

/**
 * Compares the server cookie with the resolved Firebase user.
 * Only a 401 or a valid body for another uid requires repair; anything
 * else that is not a match leaves agreement unconfirmed.
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

/**
 * This function is called whenever the firebase auth state changes.
 *
 * @param user
 */
async function handleFirebaseAuthChange(user: User | null) {
  logDebug('sessionStore', 'handleFirebaseAuthChange', {
    user: !!user,
    currentState: sessionState.get(),
    currentUid: uid.get(),
  });
  authUser.set(user);

  // User is not authenticated
  if (!user) {
    const currentState = sessionState.get();
    // Prevent redundant logout calls - if we're already in initial state or loading (during logout)
    // then we don't need to call logout() again
    if (currentState !== 'initial' && currentState !== 'loading') {
      logDebug(
        'sessionStore',
        'handleFirebaseAuthChange',
        'User logged out, calling logout()',
      );
      await logout();
    } else {
      logDebug(
        'sessionStore',
        'handleFirebaseAuthChange',
        `User logged out but session state is '${currentState}' - skipping logout() call`,
      );
    }
    return;
  }

  // User is authenticated. Persisted uid and state do not substitute for the
  // server's answer: every resolved user is checked against the cookie.
  const status = await getServerSessionStatus(user.uid);
  if (status === 'inconclusive') {
    // Agreement is unconfirmed; Firebase auth and the persisted uid stay for a later check.
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
        // A token refresh can fail offline; that is as temporary as the POST.
        const token = await user.getIdToken();
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        postStatus = response.status;
      } catch (error) {
        logWarn('sessionStore', 'Failed to post session token:', error);
      }

      if (postStatus === 401) {
        throw new Error('Session credentials rejected');
      }
      if (postStatus !== 200) {
        // Network failure or 5xx: temporary, a later check can repair.
        logWarn(
          'sessionStore',
          'handleFirebaseAuthChange',
          'Session repair failed temporarily. Not confirming session.',
        );
        sessionState.set('error');
        return;
      }
    }

    // Subscribe to account and profile - both might be missing
    try {
      await subscribeToAccount(user.uid);
    } catch (error) {
      logError('sessionStore', 'Failed to subscribe to account:', error);
    }

    try {
      subscribeToProfile(user.uid);
    } catch (error) {
      logError('sessionStore', 'Failed to subscribe to profile:', error);
    }

    await login(user.uid);

    sessionState.set('active');
    logDebug(
      'sessionStore',
      'handleFirebaseAuthChange',
      'User logged in and session is active',
    );
  } catch (error) {
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

async function login(newUid: string) {
  if (!newUid) {
    logWarn('sessionStore', 'login', 'No uid provided');
    return;
  }
  uid.set(newUid);

  // subscribe to user subscriptions data
  initSubscriberStore(newUid);
}

async function clear() {
  logDebug('sessionStore', 'clear', 'Clearing session data');
  uid.set('');
  unsubscribeFromAccount();
  unsubscribeFromProfile();
}

export async function logout() {
  const currentState = sessionState.get();
  if (currentState === 'initial') {
    logDebug(
      'sessionStore',
      'logout',
      'Session already cleared - skipping logout',
    );
    return;
  }

  if (currentState === 'loading') {
    logDebug(
      'sessionStore',
      'logout',
      'Logout already in progress - skipping duplicate call',
    );
    return;
  }

  logDebug('sessionStore', 'logout', 'Starting logout process');
  sessionState.set('loading');

  // Clear the session
  await clear();

  // Sign out from Firebase
  await auth.signOut();

  // Clear the session cookie
  await fetch('/api/auth/session', { method: 'DELETE' });

  sessionState.set('initial');
  logDebug('sessionStore', 'logout', 'Logout complete');
}

export * from './account';
export * from './subscriber';
// NOTE: Do NOT export from './computed' here to avoid circular dependency
// Import computed helpers directly: import { isActive, isRehydrating, isAnonymous } from 'src/stores/session/computed';
