import type { User } from 'firebase/auth';
import {
  beginCookieSession,
  reconcileSessionCookie,
} from 'src/utils/client/sessionCookie';

export function recoveryAttemptKey(destination: string): string {
  return `pelilauta:protected-recovery:${destination.split('#')[0]}`;
}

export type RecoveryState =
  | 'restoring'
  | 'signedOut'
  | 'retry'
  | 'unavailable'
  | 'failed'
  | 'logoutIncomplete';

type RecoveryOptions = {
  destination: string;
  storage: Pick<Storage, 'getItem' | 'setItem'> | undefined;
  resolveUser: () => Promise<User | null>;
  logout: () => Promise<boolean>;
  navigate: (destination: string) => void;
  report: (state: RecoveryState) => void;
};

export function createRecovery(options: RecoveryOptions) {
  let generation = 0;
  let pending: Promise<void> | undefined;
  let disposed = false;
  const key = recoveryAttemptKey(options.destination);

  function automaticAllowed(): boolean {
    try {
      if (!options.storage || options.storage.getItem(key)) return false;
      options.storage.setItem(key, '1');
      return true;
    } catch {
      return false;
    }
  }

  async function run(started: number) {
    const visitCurrent = () => !disposed && started === generation;
    options.report('restoring');
    try {
      const user = await options.resolveUser();
      if (!visitCurrent()) return;
      if (!user) {
        options.report('signedOut');
        return;
      }
      const identityCurrent = beginCookieSession(user.uid);
      const current = () => visitCurrent() && identityCurrent();
      const result = await reconcileSessionCookie(user, current);
      if (!current()) return;
      if (result === 'agreed') {
        options.navigate(options.destination);
      } else if (result === 'rejected') {
        options.report('failed');
        const loggedOut = await options.logout();
        if (visitCurrent())
          options.report(loggedOut ? 'failed' : 'logoutIncomplete');
      } else if (result !== 'superseded') {
        options.report('unavailable');
      }
    } catch {
      if (visitCurrent()) options.report('unavailable');
    }
  }

  return {
    attempt(automatic = false): Promise<void> {
      if (disposed) return Promise.resolve();
      if (pending) return pending;
      if (automatic && !automaticAllowed()) {
        options.report('retry');
        return Promise.resolve();
      }
      if (!automatic) {
        try {
          options.storage?.setItem(key, '1');
        } catch {}
      }
      pending = run(++generation).finally(() => {
        pending = undefined;
      });
      return pending;
    },
    cancel() {
      generation++;
      options.report('retry');
    },
    dispose() {
      disposed = true;
      generation++;
    },
  };
}
