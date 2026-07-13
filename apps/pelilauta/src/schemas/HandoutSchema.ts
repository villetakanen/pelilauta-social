import { z } from 'zod';
import { ContentEntrySchema, contentEntryFrom } from './ContentEntry';

// Note: store path to handouts is
// SITES_COLLECTION_NAME/{site.key}/HANDOUTS_COLLECTION_NAME/{handout.key}
export const HANDOUTS_COLLECTION_NAME = 'handouts';

export const HandoutSchema = ContentEntrySchema.extend({
  title: z.string(),
  siteKey: z.string(),
  readers: z.array(z.string()).optional(), // ACL array of keys with read access
});

export type Handout = z.infer<typeof HandoutSchema>;

export function handoutFrom(
  data: Partial<Handout>,
  key = '',
  siteKey = '',
): Handout {
  const entry = contentEntryFrom(data, key);

  return HandoutSchema.parse({
    ...entry,
    title: data.title || '',
    siteKey: data.siteKey || siteKey,
    readers: data.readers || [],
  });
}
