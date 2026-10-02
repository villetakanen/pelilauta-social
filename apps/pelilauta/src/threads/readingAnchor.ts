/**
 * Selects the reading anchor key to preserve viewport positioning during live updates.
 *
 * When the visible reply disappears, the next surviving reply becomes the reading anchor.
 * When no subsequent reply survives, the preceding surviving reply becomes the anchor.
 * An empty discussion returns `null` to anchor on the heading.
 *
 * @param previousKeys Reply keys in reading order before the update.
 * @param survivingKeys Reply keys in reading order after the update.
 * @param visibleKey Currently visible reply key, or `null` when none is visible.
 * @returns Reply key to anchor on, or `null` for the discussion heading.
 */
export function selectReadingAnchor(
  previousKeys: string[],
  survivingKeys: string[],
  visibleKey: string | null,
): string | null {
  if (visibleKey === null) return null;

  const surviving = new Set(survivingKeys);
  if (surviving.has(visibleKey)) return visibleKey;

  const position = previousKeys.indexOf(visibleKey);
  if (position === -1) return null;

  for (let index = position + 1; index < previousKeys.length; index++) {
    const candidate = previousKeys[index];
    if (surviving.has(candidate)) return candidate;
  }
  for (let index = position - 1; index >= 0; index--) {
    const candidate = previousKeys[index];
    if (surviving.has(candidate)) return candidate;
  }

  return null;
}
