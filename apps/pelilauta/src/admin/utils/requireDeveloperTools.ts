import type { APIContext } from 'astro';
import { requireAdmin } from './requireAdmin';

/** Whether this environment shows the developer tools at all. */
export const showDeveloperTools =
  import.meta.env.PUBLIC_SHOW_DEVELOPER_TOOLS === 'true';

/**
 * The guard a developer tool takes: administration's, and this environment
 * showing the tools at all. A tool the environment does not show is not there,
 * so the reader gets the answer for a page that does not exist.
 */
export async function requireDeveloperTools(
  astro: APIContext,
): Promise<Response | undefined> {
  const denied = await requireAdmin(astro);

  if (denied) {
    return denied;
  }

  if (!showDeveloperTools) {
    return astro.redirect('/404');
  }

  return undefined;
}
