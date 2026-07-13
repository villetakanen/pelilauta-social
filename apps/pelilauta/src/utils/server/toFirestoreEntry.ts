import type { Entry } from '@schemas/EntrySchema';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface Params {
  silent?: boolean;
}

/**
 * Server-side version of toFirestoreEntry
 *
 * Converts Entry data to Firestore-compatible format using firebase-admin SDK
 *
 * @param entry A partial entry or an object that extends Entry
 * @param params { silent: boolean }, if silent is true, timestamps won't be updated
 * @returns A Record with the entry fields converted to a format supported by Firestore Admin SDK
 */
export function toFirestoreEntry(
  entry: Partial<Entry>,
  params: Params = { silent: false },
) {
  if (!params.silent) {
    return {
      ...entry,
      author: entry.owners && entry.owners.length > 0 ? entry.owners[0] : '-',
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
    author: entry.owners ? entry.owners[0] : '-',
  };
}

/**
 * Server-side version of toFirestoreEntryUpdate
 *
 * Updates an existing entry with new timestamps
 */
export function toFirestoreEntryUpdate(entry: Partial<Entry>) {
  return {
    ...entry,
    updatedAt: FieldValue.serverTimestamp(),
    flowTime: FieldValue.serverTimestamp(),
  };
}
