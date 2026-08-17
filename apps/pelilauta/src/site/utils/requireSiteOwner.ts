import { requireSession } from '@pelilauta/base/utils/requireSession';
import type { APIContext } from 'astro';
import type { Site } from 'src/schemas/SiteSchema';

/**
 * The guard a site owner tool takes. It answers with what the page returns to a
 * reader who may not open it, and with nothing to a site owner.
 *
 * v18 leaves these pages open and lets the client app decide what to render,
 * which shows a site's members, tools and metadata to anybody holding the
 * address.
 */
export async function requireSiteOwner(
  astro: APIContext,
  site: Site,
): Promise<Response | undefined> {
  const { uid, denied } = await requireSession(astro);

  if (denied) {
    return denied;
  }

  if (!site.owners.includes(uid)) {
    return new Response('Forbidden', { status: 403 });
  }

  return undefined;
}
