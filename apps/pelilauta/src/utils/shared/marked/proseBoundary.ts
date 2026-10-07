import type { Token } from 'marked';

/**
 * Whether a marker may start at the current inline position, given the
 * tokens already produced for this run of prose. Start of prose and a
 * preceding line break always permit it; after text, the last character
 * must be one of `allowed`.
 */
export function followsBoundary(
  previous: Token | undefined,
  allowed: RegExp,
): boolean {
  if (!previous) return true;
  if (previous.type === 'br') return true;
  if (previous.type !== 'text') return false;
  const last = previous.raw.at(-1);
  return last !== undefined && allowed.test(last);
}
