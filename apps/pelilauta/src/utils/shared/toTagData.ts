import type { ContentEntry } from '@schemas/ContentEntry';
import { type Tag, TagSchema } from '@schemas/TagSchema';
import { logWarn } from '@utils/logHelpers';

/**
 * Converts a ContentEntry to TagSchema data for the tag index collection.
 *
 * This helper ensures consistent tag normalization (lowercase) across all
 * content types (threads, pages, etc.) to fix case-sensitivity issues with
 * Firestore queries using TAG_SYNONYMS.
 *
 * IMPORTANT: flowTime must be a positive integer. If flowTime is 0 or negative,
 * this function will use Date.now() as a fallback to prevent TagSchema validation errors.
 *
 * @param entry - The content entry (thread, page, etc.)
 * @param key - The unique key for the tag index entry
 * @param type - The content type ('thread' or 'page')
 * @param flowTime - The flow time as timestamp (milliseconds)
 * @returns Parsed Tag object ready for Firestore
 */
export function toTagData(
  entry: Pick<ContentEntry, 'tags' | 'owners'> & {
    title?: string;
    name?: string;
  },
  key: string,
  type: 'thread' | 'page',
  flowTime: number,
): Tag {
  const title = 'title' in entry ? entry.title : entry.name;

  // Ensure flowTime is positive (TagSchema requires positive integer)
  let validFlowTime = flowTime;
  if (flowTime <= 0) {
    logWarn('toTagData', 'Invalid flowTime, using current time as fallback', {
      flowTime,
      key,
    });
    validFlowTime = Date.now();
  }

  return TagSchema.parse({
    key,
    title: title || '',
    type,
    author: entry.owners?.[0] || '',
    tags: entry.tags?.map((t) => t.toLowerCase()) || [],
    flowTime: validFlowTime,
  });
}
