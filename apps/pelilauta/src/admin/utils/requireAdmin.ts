import { isAdmin } from '@firebase/server/admin';
import { requireSession } from '@pelilauta/base/utils/requireSession';
import type { APIContext } from 'astro';

/**
 * The guard a page of administration takes. It answers with what the page
 * returns to a reader who does not hold the tools, and with nothing to one who
 * does.
 *
 * v18 guarded the forum channels alone, and left the rest to the client.
 */
export async function requireAdmin(
  astro: APIContext,
): Promise<Response | undefined> {
  const { uid, denied } = await requireSession(astro);

  if (denied) {
    return denied;
  }

  if (!(await isAdmin(uid))) {
    return astro.redirect('/403');
  }

  return undefined;
}
