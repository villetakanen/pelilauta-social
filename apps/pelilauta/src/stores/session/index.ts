import { auth } from '@firebase/client';
import { persistentAtom } from '@nanostores/persistent';
import { pushSnack } from '@utils/client/snackUtils';
import { logDebug, logError, logWarn } from '@utils/logHelpers';
import type { User } from 'firebase/auth';
import { atom, computed, onMount } from 'nanostores';
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

// We need to listen to Firebase auth state changes if any of the components
// are interested in the session state
onMount(uid, () => {
  const unsubscribe = auth.onAuthStateChanged(handleFirebaseAuthChange);
  logDebug('sessionStore', 'onMount', 'Subscribed to auth state changes');
  return () => {
    unsubscribe();
    logDebug('sessionStore', 'onMount', 'Unsubscribed from auth state changes');
  };
});

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

  // User is authenticated
  if (uid.get() === user.uid && sessionState.get() === 'active') {
    // Verify server session integrity before trusting client state
    let serverSessionValid = false;
    try {
      const response = await fetch('/api/auth/session');
      serverSessionValid = response.ok;
    } catch (error) {
      logWarn('sessionStore', 'Failed to check server session:', error);
    }

    if (serverSessionValid) {
      logDebug(
        'sessionStore',
        'handleFirebaseAuthChange',
        'User already logged in and session is active, checking if subscriptions need refresh',
      );

      // Even if session is active, we should ensure subscriptions are active
      // This handles cases where session state was restored from localStorage
      // but subscriptions were not re-established
      try {
        await subscribeToAccount(user.uid);
        subscribeToProfile(user.uid);
        logDebug(
          'sessionStore',
          'handleFirebaseAuthChange',
          'Refreshed subscriptions for active session',
        );
      } catch (error) {
        logError('sessionStore', 'Failed to refresh subscriptions:', error);
      }
      return;
    } else {
      logDebug(
        'sessionStore',
        'handleFirebaseAuthChange',
        'Client session active but server session missing/invalid. Re-authenticating.',
      );
    }
  }

  try {
    sessionState.set('loading');
    const token = await user.getIdToken();
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

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
