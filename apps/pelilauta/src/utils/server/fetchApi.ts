import { logError } from '../logHelpers';

/**
 * Reads one of the app's own API routes from server code and returns its parsed
 * JSON, or `null` when the route does not answer with success. The caller
 * parses the value into its own shape.
 */
export async function fetchApiJson(
  astro: { url: URL },
  path: string,
): Promise<unknown | null> {
  try {
    const response = await fetch(new URL(path, astro.url.origin));
    if (!response.ok) {
      logError('fetchApiJson', path, response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    logError('fetchApiJson', path, error);
    return null;
  }
}
