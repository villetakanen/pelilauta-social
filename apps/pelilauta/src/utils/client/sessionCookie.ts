import type { User } from 'firebase/auth';

let identity: string | null = null;
let generation = 0;
let blocked = false;
let pending: Promise<unknown> = Promise.resolve();
let exchange: { generation: number; result: Promise<Response> } | undefined;
let lastExchange: typeof exchange;
export type CookieAgreement =
  | 'agreed'
  | 'rejected'
  | 'unavailable'
  | 'superseded';
let reconciliation:
  | { generation: number; result: Promise<CookieAgreement> }
  | undefined;

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
    lastExchange = exchange;
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

export function reconcileSessionCookie(
  user: User,
  current: () => boolean,
): Promise<CookieAgreement> {
  if (!current()) return Promise.resolve('superseded');
  if (!reconciliation || reconciliation.generation !== generation) {
    const result = reconcile(user, current);
    reconciliation = { generation, result };
    void result.finally(() => {
      if (reconciliation?.result === result) reconciliation = undefined;
    });
  }
  return reconciliation.result;
}

async function reconcile(
  user: User,
  current: () => boolean,
): Promise<CookieAgreement> {
  const previousExchange = lastExchange;
  try {
    await waitForCookieSynchronization();
    if (!current()) return 'superseded';
    const response = await fetch('/api/auth/session');
    if (!current()) return 'superseded';
    if (response.status !== 401) {
      if (response.status !== 200) return 'unavailable';
      const body = await response.json();
      if (!current()) return 'superseded';
      if (
        typeof body?.uid !== 'string' ||
        !body.uid ||
        !Number.isInteger(body.expiresAt)
      ) {
        return 'unavailable';
      }
      if (body.uid === user.uid) return 'agreed';
    }
    const repair =
      lastExchange &&
      lastExchange !== previousExchange &&
      lastExchange.generation === generation
        ? await lastExchange.result
        : await synchronizeSessionCookie(user, current);
    if (!current()) return 'superseded';
    if (repair.status === 200) return 'agreed';
    return repair.status === 401 ? 'rejected' : 'unavailable';
  } catch {
    return current() ? 'unavailable' : 'superseded';
  }
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
