/**
 * Derives a footnote namespace (ASCII letters, digits and hyphens) from a
 * prefix and a key, for the rendered instance that key identifies.
 */
export function footnoteNamespace(prefix: string, key: string): string {
  const safe = key.replace(/[^A-Za-z0-9-]/g, '-');
  return `${prefix}-${safe}`;
}
