/**
 * A Tag info schema of an entry
 *
 * Fields:
 * - type: 'thread' | 'page'
 * - key: string // f.ex. 4124124 or 124423dqw/eeqweq -> in the case of a page, the first part of the page is site-id
 * - tags: string[] // f.ex. ['tag1', 'tag2', 'tag3']
 * - flowTime: the time of the last update, from the entry
 * - author: the last author of the entry
 */

import { z } from 'zod';

export const TAG_FIRESTORE_COLLECTION = 'tags';

export const TagSchema = z.object({
  title: z.string(),
  type: z.enum(['thread', 'page']),
  key: z.string(),
  tags: z.array(z.string()),
  author: z.string(),
  flowTime: z.number().int().positive(),
});

export type Tag = z.infer<typeof TagSchema>;
