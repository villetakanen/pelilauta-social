/**
 * meta/topics is a separate firestore entry, that contains an array of topics and their metadata.
 *
 * This schema is used to define the structure of the topics object in the firestore database.
 *
 * BREAKING CHANGE: this schema and the separate topics entry, are not compatible with
 * version 15 or earlier of Pelilauta.
 */

import { z } from 'zod';

export const topicSchema = z.object({
  name: z.string(), // The name of the topic
  description: z.string().optional(), // A description of the topic
  icon: z.string(), // The icon of the topic
  slug: z.string(), // The slug of the topic
  category: z.string().optional(), // The category of the topic, optional
  threadCount: z.number().default(0), // The number of threads in the topic
  flowTime: z.number().optional(), // The flowTime (latest post to the topic)
});

export const MetaTopicsSchema = z.array(topicSchema);

export type Topic = z.infer<typeof topicSchema>;

export type MetaTopics = z.infer<typeof MetaTopicsSchema>;
