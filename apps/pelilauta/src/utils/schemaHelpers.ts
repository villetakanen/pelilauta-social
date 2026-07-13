import type { Entry } from 'src/schemas/EntrySchema';
import { systemToNounMapping } from '../schemas/nouns';
import { logWarn } from './logHelpers';

type Timestamp = {
  seconds: number;
  nanoseconds: number;
};

export function toDate(variable: unknown): Date {
  if (!variable) return new Date();
  if (variable instanceof Date) return variable;
  if (typeof variable === 'string') return new Date(variable);
  if (typeof variable === 'number') return new Date(variable);

  const virtual = variable as Timestamp;
  if (virtual.seconds) return new Date(virtual.seconds * 1000);

  return new Date();
}

/*export function topicToNoun(topic: string | undefined): string {
  logWarn(
    'topicToNoun is a development time helper, it should be replaced with a meta-store mapping in production',
  );

  switch (topic) {
    case 'Roolipelit':
      return 'd20';
    case 'Yleinen':
      return 'discussion';
    case 'Videot':
      return 'youtube';
    default:
      return 'fox';
  }
}*/

export function systemToNoun(system: string | undefined): string {
  if (Object.keys(systemToNounMapping).includes(system || '')) {
    return systemToNounMapping[system || ''];
  }
  logWarn('missing systemToNoun mapping, using homebrew as default', system);
  return 'homebrew';
}

/**
 * This function normalizes the flowTime to a number.
 *
 * Sometimes an entry might be missing th flowTime, or it might be in a legacy
 * format.
 *
 * Assuming the flowTime is not found, we try using updatedAt, and if that is
 * not found, we try using createdAt. If none of these are found, we default to 0.
 *
 * @param entry
 * @returns
 */
export function parseFlowTime(entry: Partial<Entry>): number {
  return entry.flowTime
    ? toDate(entry.flowTime).getTime()
    : entry.updatedAt
      ? toDate(entry.updatedAt).getTime()
      : entry.createdAt
        ? toDate(entry.createdAt).getTime()
        : 0;
}

/**
 * Returns a valid positive flowTime for tag indexing.
 *
 * Falls back to Date.now() if the computed flowTime is not a positive number.
 * This prevents TagSchema validation failures when flowTime is 0 or invalid.
 *
 * @param entry - Entry with flowTime, updatedAt, or createdAt
 * @returns Positive integer timestamp in milliseconds
 */
export function getValidFlowTime(entry: Partial<Entry>): number {
  const flowTime = parseFlowTime(entry);

  // Ensure flowTime is positive (TagSchema requires positive integer)
  if (flowTime > 0) {
    return flowTime;
  }

  // Fallback to current time if flowTime is 0 or invalid
  logWarn(
    'getValidFlowTime',
    'Invalid flowTime, using current time as fallback',
    {
      flowTime,
      entryKey: 'key' in entry ? entry.key : 'unknown',
    },
  );

  return Date.now();
}
