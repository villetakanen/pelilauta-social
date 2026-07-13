import type { ContentEntry } from '@schemas/ContentEntry';
import { toClientEntry } from './entryUtils';

/**
 * Converts a Firestore ContentEntry document to client format.
 *
 * Extends toClientEntry with ContentEntry-specific handling:
 * - Normalizes tags to lowercase for consistency with tag queries
 * - Handles ContentEntry-specific fields
 *
 * @param entry - Raw Firestore document data
 * @returns ContentEntry with normalized fields
 */
export function toClientContentEntry(
  entry: Record<string, unknown>,
): ContentEntry {
  const baseEntry = toClientEntry(entry);

  return {
    ...baseEntry,
    tags: Array.isArray(entry.tags)
      ? entry.tags.map((t) => String(t).toLowerCase())
      : [],
    markdownContent: entry.markdownContent as string | undefined,
    htmlContent: entry.htmlContent as string | undefined,
    content: entry.content as string | undefined,
    images: Array.isArray(entry.images) ? (entry.images as string[]) : [],
    public: entry.public as boolean | undefined,
    sticky: entry.sticky as boolean | undefined,
    author: entry.author as string | undefined,
  } as ContentEntry;
}
