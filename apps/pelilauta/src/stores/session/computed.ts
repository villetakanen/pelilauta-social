import { computed } from 'nanostores';
import { sessionState, uid } from './index';

/**
 * Session state helpers to properly handle the "Optimistic UID" problem.
 *
 * Because `uid` is persisted to localStorage, it's available synchronously on page load
 * before Firebase Auth has verified the session. These helpers provide clean primitives
 * to distinguish between persisted state and verified state.
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
 * Returns true when we have a persisted UID but the session is not yet verified.
 * This happens during:
 * - Page load when localStorage has a UID but Firebase Auth hasn't verified yet
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
 * Returns true only when the session is fully verified and active.
 * This is the ONLY safe check for features requiring authentication.
 *
 * DO NOT use direct `$uid` checks for authentication - use this instead.
 */
export const isActive = computed([sessionState, uid], (state, currentUid) => {
  return currentUid !== '' && state === 'active';
});
