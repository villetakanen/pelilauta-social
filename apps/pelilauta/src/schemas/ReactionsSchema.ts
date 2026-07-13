/**
 * Core concepts:
 * - Each *Entry* has a *Reactions* object in the DB that contains the reactions to that entry.
 * - Each *Reaction* has a *type*, *count* and *users* array. The Count is not stored in the DB, but calculated on the fly.
 * - The *users* array contains the pseudoanonymous user ids of the users that have reacted with the reaction.
 * - subscriptions are used to keep track of the users interested in the entry. F.ex. the owner(s) of the entry.
 *
 * F.ex. a *love* reaction by "user3" to an entry might look like this in the DB:
 * ENTRY_KEY:
 * - subscribers: ['user1', 'user4]
 * - type: 'love'
 * -- users: ['user1', 'user2', 'user3']
 * - type: 'bookmark'
 * -- users: ['user1', 'user2']
 *
 * DB key of the reactions entry is same as the entry key.
 *
 * To query, if a user has reacted with a reaction, you can check if the user id is in the *users* array.
 */
import { z } from 'zod';

export const REACTIONS_COLLECTION_NAME = 'reactions';

export const reactionsSchema = z.object({
  subscribers: z.array(z.string()), // The users that are subscribed to the entry
  love: z.array(z.string()).optional(), // The users that have reacted with love
  // N.B. We do not support other reactions for now.
});

export type Reactions = z.infer<typeof reactionsSchema>;
