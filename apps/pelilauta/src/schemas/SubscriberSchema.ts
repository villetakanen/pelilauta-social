import { z } from 'zod';

export const SUBSCRIPTIONS_FIRESTORE_PATH = 'subscriptions';

/**
 * Subscriber schema
 *
 * This schema is used to portray the user as a subscriber. It contains the following fields:
 * - key: string, unique key of the subscriber
 * - allSeenAt: number, timestamp of the last time the subscriber has seen all the messages
 * - seenEntities: Record<string, number>, a record of entity keys and the timestamp of the last time the subscriber has seen the entity
 * - pushMessages: boolean, whether the subscriber should receive push messages
 * - notifyOnThreads: boolean, whether the subscriber should receive notifications on threads
 * - notifyOnLikes: boolean, whether the subscriber should receive notifications on mentions
 * - messagingTokens: string[], an array of messaging tokens
 */
export const SubscriptionSchema = z.object({
  uid: z.string(),
  allSeenAt: z.number(),
  seenEntities: z.record(z.string(), z.number()),
  pushMessages: z.boolean().default(false),
  notifyOnThreads: z.boolean(),
  notifyOnLikes: z.boolean(),
  messagingTokens: z.array(z.string()).default([]),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

export function createSubscription(key: string): Subscription {
  return {
    uid: key,
    allSeenAt: Date.now(),
    seenEntities: {},
    pushMessages: false,
    notifyOnThreads: false,
    notifyOnLikes: false,
    messagingTokens: [],
  };
}

export function parseSubscription(
  data: Partial<Subscription>,
  uid: string,
): Subscription {
  return {
    uid,
    allSeenAt: data.allSeenAt || Date.now(),
    seenEntities: data.seenEntities || {},
    pushMessages: data.pushMessages || false,
    notifyOnThreads: data.notifyOnThreads || false,
    notifyOnLikes: data.notifyOnLikes || false,
    messagingTokens: data.messagingTokens || [],
  };
}
