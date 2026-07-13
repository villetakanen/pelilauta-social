/**
 * Checks if a string is a valid URL including protocol.
 * Used for client-side validation of profile links.
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
