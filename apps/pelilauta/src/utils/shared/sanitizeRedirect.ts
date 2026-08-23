/**
 * Validate a `redirect` destination as a relative path inside the service.
 * Absolute and protocol-relative values ("http://…", "//…", "/\…") are
 * discarded for the front page, so a login link cannot forward a reader
 * off-origin.
 */
export function sanitizeRedirect(candidate: string | null | undefined): string {
  if (!candidate) return '/';
  if (!candidate.startsWith('/')) return '/';
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) return '/';
  return candidate;
}
