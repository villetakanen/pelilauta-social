import type { ContentEntry } from '@schemas/ContentEntry';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Params } from './toFirestoreEntry';

/**
 * Server-side version of toFirestoreContentEntry
 *
 * Converts ContentEntry data to Firestore-compatible format using firebase-admin SDK
 * with ContentEntry-specific handling including tag normalization.
 *
 * @param entry - A partial ContentEntry
 * @param params - { silent: boolean }, if silent is true, timestamps won't be updated
 * @returns A Record with the entry fields converted to Firestore Admin SDK format
 */
export function toFirestoreContentEntry(
  entry: Partial<ContentEntry>,
  params: Params = { silent: false },
) {
  // Normalize tags to lowercase
  const normalizedTags = entry.tags?.map((t) => t.toLowerCase()) || [];

  if (!params.silent) {
    return {
      ...entry,
      tags: normalizedTags,
      author:
        entry.author ||
        (entry.owners && entry.owners.length > 0 ? entry.owners[0] : ''),
      createdAt: entry.createdAt
        ? Timestamp.fromMillis(entry.createdAt.getTime())
        : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      flowTime: FieldValue.serverTimestamp(),
    };
  }

  // Silent mode: don't update timestamps
  const { createdAt, updatedAt, flowTime, ...rest } = entry;

  return {
    ...rest,
    tags: normalizedTags,
    author: entry.author || (entry.owners ? entry.owners[0] : ''),
  };
}
