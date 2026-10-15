import { computed } from 'nanostores';
import { authUser, sessionState, uid } from './index';

/**
 * Session state helpers to properly handle the "Optimistic UID" problem.
 *
 * Because `uid` is persisted to localStorage, it is available synchronously on page load
 * as a saved sign-in hint, before this page has verified the session. Session state
 * starts at `initial` on every page load. These helpers distinguish the saved hint
 * from verification completed on this page.
 */

/**
 * Returns true when the user is truly anonymous (no UID, state is initial).
 * This is the clean slate state - no persisted session, no active session.
 */
export const isAnonymous = computed(
  [sessionState, uid],
  (state, currentUid) => {
    return state === 'initial' && currentUid === '';
  },
);

/**
 * Returns true when a saved UID hint exists and verification has not settled.
 * This happens during:
 * - Page load, until the status check and any repair settle
 * - During login/logout transitions
 *
 * UI should typically show a loading state during rehydration.
 */
export const isRehydrating = computed(
  [sessionState, uid],
  (state, currentUid) => {
    return currentUid !== '' && (state === 'initial' || state === 'loading');
  },
);

/**
 * Returns true only after this page's verification: a matching status response
 * or a successful repair. A saved UID alone never makes it true.
 * This is the ONLY safe check for features requiring authentication.
 *
 * DO NOT use direct `$uid` checks for authentication - use this instead.
 */
export const isActive = computed([sessionState, uid], (state, currentUid) => {
  return currentUid !== '' && state === 'active';
});

/**
 * Adds to `isActive` that the Firebase user in this page load matches the
 * session UID. Gate reads and subscriptions on this store.
 */
export const isResolvedActive = computed(
  [sessionState, uid, authUser],
  (state, currentUid, user) => {
    return (
      currentUid !== '' &&
      state === 'active' &&
      user !== null &&
      user.uid === currentUid
    );
  },
);
