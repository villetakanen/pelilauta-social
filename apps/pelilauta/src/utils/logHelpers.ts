import { z } from 'zod';

/**
 * Structural check for a Firebase error, deliberately without importing the
 * Firebase client SDK.
 *
 * This module is imported by essentially every server route, so importing
 * `firebase/app` here put the *client* SDK into the SSR module graph as a
 * runtime external. When a deploy shipped a function without that package, the
 * unresolved import took down every page at once. `FirebaseError` sets
 * `name = 'FirebaseError'`, so recognizing it needs no import and keeps the
 * logging output identical.
 */
function isFirebaseError(error: unknown): error is Error & { code: string } {
  return error instanceof Error && error.name === 'FirebaseError';
}

export function logError(...args: unknown[]) {
  for (const arg of args) {
    if (arg instanceof z.ZodError) {
      logError(arg.issues);
    } else {
      if (isFirebaseError(arg)) {
        console.error('🔥', arg.code, arg.message);
      } else {
        console.error('🦑', ...args);
      }
    }
  }
}

export function logWarn(...args: unknown[]) {
  console.warn('⚠️', ...args);
}
export function logDebug(...args: unknown[]) {
  // Only log debug messages if the debug feature flag is enabled
  if (import.meta.env.PUBLIC_FEATURE_FLAG_DEBUG === 'true') {
    console.debug('🐛', ...args);
  }
}
