import { persistentAtom } from '@nanostores/persistent';
import type { User } from 'firebase/auth';
import { atom } from 'nanostores';
import { logDebug } from 'src/utils/logHelpers';

export let sessionManagerStarted = false;
export function markSessionManagerStarted(): void {
  sessionManagerStarted = true;
}

export const authUser = atom<User | null>(null);
export type SessionState = 'initial' | 'loading' | 'active' | 'error';
export const sessionState = atom<SessionState>('initial');
export const uid = persistentAtom<string>('session-uid', '');

sessionState.subscribe((state, oldState) => {
  if (state !== oldState) {
    logDebug('sessionStore', 'sessionState changed', {
      from: oldState,
      to: state,
    });
  }
});

if (typeof document !== 'undefined') {
  uid.subscribe((value) => {
    document.documentElement.classList.toggle(
      'has-session-uid',
      Boolean(value),
    );
  });
}
