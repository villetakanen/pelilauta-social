import type { User } from 'firebase/auth';

let identity: string | null = null;
let generation = 0;
let blocked = false;
let pending: Promise<unknown> = Promise.resolve();
let exchange: { generation: number; result: Promise<Response> } | undefined;

export function beginCookieSession(uid: string | null): () => boolean {
  if (identity !== uid) {
    identity = uid;
    generation++;
  }
  return cookieSessionCurrent(uid);
}

export function cookieSessionCurrent(uid: string | null): () => boolean {
  const started = generation;
  return () => !blocked && generation === started && identity === uid;
}

export async function synchronizeSessionCookie(
  user: User,
  current: () => boolean,
): Promise<Response> {
  if (!current()) throw new Error('Session exchange superseded');
  if (!exchange || exchange.generation !== generation) {
    const started = generation;
    const result = pending
      .catch(() => {})
      .then(async () => {
        if (!current()) throw new Error('Session exchange superseded');
        const token = await user.getIdToken();
        if (!current()) throw new Error('Session exchange superseded');
        return fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      });
    exchange = { generation: started, result };
    pending = result;
    void result
      .finally(() => {
        if (exchange?.result === result) exchange = undefined;
      })
      .catch(() => {});
  }
  const response = await exchange.result;
  return response.clone();
}

/** A status check cannot confirm a cookie while an earlier POST remains in flight. */
export async function waitForCookieSynchronization(): Promise<void> {
  await pending.catch(() => {});
}

/** Cookie deletion waits for dispatched creation to settle. */
export async function blockCookieSynchronization(): Promise<void> {
  blocked = true;
  generation++;
  await waitForCookieSynchronization();
}

export function resumeCookieSynchronization(): void {
  identity = null;
  blocked = false;
}
