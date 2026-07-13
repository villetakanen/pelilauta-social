import { z } from 'zod';

export const TOPICS_META_REF = 'meta/threads';

export const TopicsSchema = z.array(z.string());

export type Topics = z.infer<typeof TopicsSchema>;
