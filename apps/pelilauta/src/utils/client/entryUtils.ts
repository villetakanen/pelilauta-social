import type { Entry } from 'src/schemas/EntrySchema';
import { toDate } from 'src/utils/schemaHelpers';

/**
 * Firestore handles dates as Timestamps, so we need to convert them from Timestamp to Date or number.
 *
 * Due to historical reasons, the owners field can be a string or an array of strings,
 * so we need to normalize it to always be an array of strings.
 */
export function toClientEntry(entry: Record<string, unknown>) {
  const flowTime = entry.flowTime
    ? toDate(entry.flowTime).getTime()
    : entry.updatedAt
      ? toDate(entry.updatedAt).getTime()
      : entry.createdAt
        ? toDate(entry.createdAt).getTime()
        : 0;

  const owners = entry.owners
    ? typeof entry.owners === 'string'
      ? [entry.owners]
      : entry.owners
    : entry.author
      ? [entry.author]
      : [];

  return {
    ...entry,
    createdAt: toDate(entry.createdAt),
    updatedAt: toDate(entry.updatedAt),
    flowTime,
    owners,
  } as Entry;
}
