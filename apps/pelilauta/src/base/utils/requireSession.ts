import { verifySession } from '@utils/server/auth/verifySession';
import type { APIContext } from 'astro';

/**
 * The guard a page takes where a reader without a session has no business. It
 * belongs to the base application because every application needs it.
 *
 * A page states the guard and returns what it answers with; the reader's uid
 * comes back with it, so the page verifies the session once.
 */
type Guarded = { uid: string; denied: null } | { uid: null; denied: Response };

export async function requireSession(astro: APIContext): Promise<Guarded> {
  const session = await verifySession(astro);

  if (!session?.uid) {
    return {
      uid: null,
      denied: astro.redirect(
        `/login?redirect=${encodeURIComponent(astro.url.pathname)}`,
      ),
    };
  }

  return { uid: session.uid, denied: null };
}
