import type { Snack } from '@design-system/components/CnSnackbar.svelte';
import { atom } from 'nanostores';
import { type LocaleSubstitutions, t } from 'src/utils/i18n';

/**
 * Application feedback: the one contract a surface reports through, and the
 * queue the reports wait in. `specs/pelilauta/application-feedback/spec.md`
 * states the behaviour.
 *
 * A report is application state, not a browser event. Every producer here
 * writes to `snacks`, and `SnackbarHost` — one per layout — reads it. That is
 * what lets a surface report before the host has mounted: the report waits in
 * the queue instead of being dispatched into a document that has nobody
 * listening yet.
 *
 * An operation that ends by navigating has nowhere to report to, because its
 * document is about to go. `pushSessionSnack` hands one message to the next
 * document instead; the host there picks it up.
 */

export type { Snack };

/** The key the hand-off is stored under, in the tab's own storage. */
const SESSION_KEY = 'snack';

/**
 * Reports waiting to be shown, oldest first. The host presents the first and
 * calls `dismissSnack` when CnSnackbar releases it.
 */
export const snacks = atom<Snack[]>([]);

/** A locale key with substitutions, or the message itself. */
function resolve(snack: string | Snack, subs?: LocaleSubstitutions): Snack {
  return typeof snack === 'string' ? { message: t(snack, subs) } : snack;
}

/** Reports feedback in the current document. */
export function pushSnack(
  snack: string | Snack,
  subs?: LocaleSubstitutions,
): void {
  snacks.set([...snacks.get(), resolve(snack, subs)]);
}

/**
 * Reports feedback the reader should see in the document being navigated to.
 * One is held at a time — a later call replaces the one before it, because the
 * destination presents what the operation ended with.
 *
 * An action cannot travel: its callback belongs to the document that wrote it,
 * and storage carries no functions. Offering the reader a button that cannot do
 * anything is worse than the error, so this rejects the snack instead.
 */
export function pushSessionSnack(
  snack: string | Snack,
  subs?: LocaleSubstitutions,
): void {
  const resolved = resolve(snack, subs);
  if (resolved.action) {
    throw new TypeError(
      'pushSessionSnack cannot carry an action across a navigation.',
    );
  }
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(resolved));
}

/**
 * Reads the hand-off the previous document left, if it left a valid one, and
 * clears it either way. Called by the host once it has mounted, so a message
 * arriving this way waits in the same queue as any other.
 */
export function takeSessionSnack(): void {
  const stored = window.sessionStorage.getItem(SESSION_KEY);
  if (stored === null) return;

  const snack = readStoredSnack(stored);
  if (snack) snacks.set([...snacks.get(), snack]);
  window.sessionStorage.removeItem(SESSION_KEY);
}

/** A stored hand-off is one message and nothing else, or it is not one. */
function readStoredSnack(stored: string): Snack | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return undefined;
  }
  if (typeof parsed !== 'object' || parsed === null) return undefined;

  const { message, action } = parsed as Partial<Snack>;
  if (typeof message !== 'string' || message.length === 0) return undefined;
  if (action !== undefined) return undefined;

  return { message };
}

/** Releases the presented snack, so the next one becomes current. */
export function dismissSnack(): void {
  snacks.set(snacks.get().slice(1));
}
