import { persistentAtom } from '@nanostores/persistent';
import { computed, type WritableAtom } from 'nanostores';
import {
  createSubscription,
  SUBSCRIPTIONS_FIRESTORE_PATH,
  type Subscription,
  SubscriptionSchema,
} from 'src/schemas/SubscriberSchema';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';
import { uid } from '../session';

/**
 * # Subscription Store
 *
 * Manages user-specific read states and notifications for the role-playing games community.
 * This store synchronizes with Firestore to track which entries/threads/content a user has seen.
 *
 * ## Core Functionality
 *
 * - **Read State Tracking**: Maintains a record of which entities (threads, posts, etc.)
 *   the user has viewed and when
 * - **Real-time Sync**: Automatically syncs with Firestore when the user's UID changes
 * - **Persistent Storage**: Caches subscription data in localStorage for offline access
 * - **"Mark All Read"**: Supports bulk marking via `allSeenAt` timestamp
 *
 * ## Key Exports
 *
 * - `subscription`: The main store containing user's read states
 * - `hasSeen(entityKey, flowTime)`: Check if user has seen a specific entity
 * - `markEntrySeen(entityKey)`: Mark an entity as seen with current timestamp
 * - `setSeen(entityKey, flowTime)`: Set specific seen timestamp for an entity
 *
 * ## Data Structure
 *
 * The subscription contains:
 * - `seenEntities`: Map of entityKey -> timestamp when last seen
 * - `allSeenAt`: Optional timestamp for "mark all as read" functionality
 *
 * ## Usage in Svelte Components
 *
 * ```typescript
 * import { subscription, hasSeen } from './';
 *
 * // In component
 * const hasUserSeen = $derived($hasSeen('thread-123', 1640995200000));
 * ```
 */
export const subscription: WritableAtom<Subscription | null> = persistentAtom(
  'subscription',
  null,
  {
    encode: JSON.stringify,
    decode: (data) => {
      const object = JSON.parse(data);
      try {
        return SubscriptionSchema.parse(object);
      } catch (_error) {
        return null;
      }
    },
  },
);

// Track the current Firestore listener
let fsUnsubscribe: (() => void) | null = null;
let currentUid: string | null = null;

// Helper function to create a new subscription document
async function createSubscriptionDocument(userId: string) {
  try {
    const { getFirestore, setDoc, doc } = await import('firebase/firestore');
    const docRef = doc(getFirestore(), SUBSCRIPTIONS_FIRESTORE_PATH, userId);

    const newSubscription = createSubscription(userId);

    await setDoc(docRef, newSubscription);
    return newSubscription;
  } catch (error) {
    logError(
      'subscriptionStore',
      'createSubscriptionDocument',
      `Failed to create subscription for ${userId}:`,
      error,
    );
    throw error;
  }
}

// Computed store that reacts to uid changes and manages subscription
const subscriptionManager = computed(uid, async (currentUidValue) => {
  // Clean up existing listener if uid changed
  if (fsUnsubscribe && currentUid !== currentUidValue) {
    fsUnsubscribe();
    fsUnsubscribe = null;
    currentUid = null;
  }

  // If no uid, clear subscription
  if (!currentUidValue) {
    subscription.set(null);
    return;
  }

  // If already listening to the same uid, do nothing
  if (currentUid === currentUidValue && fsUnsubscribe) {
    logWarn(
      'subscriptionStore',
      'Trying to re-init subscriptions of:',
      currentUidValue,
    );
    return;
  }

  currentUid = currentUidValue;

  try {
    const { getFirestore, onSnapshot, doc } = await import(
      'firebase/firestore'
    );
    const docRef = doc(
      getFirestore(),
      SUBSCRIPTIONS_FIRESTORE_PATH,
      currentUidValue,
    );

    fsUnsubscribe = onSnapshot(
      docRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          try {
            const parsedData = SubscriptionSchema.parse(snapshot.data());
            subscription.set(parsedData);
          } catch (error) {
            logError(
              'subscriptionStore',
              'Failed to parse subscription data:',
              error,
            );
            subscription.set(null);
          }
        } else {
          // Document doesn't exist, create a new one
          try {
            const newSubscription =
              await createSubscriptionDocument(currentUidValue);
            subscription.set(newSubscription);
          } catch (error) {
            logError(
              'subscriptionStore',
              'Failed to create new subscription:',
              error,
            );
            subscription.set(null);
          }
        }
      },
      (error) => {
        logError('subscriptionStore', 'Firestore listener error:', error);
        subscription.set(null);
      },
    );
  } catch (error) {
    logError('subscriptionStore', 'Failed to setup Firestore listener:', error);
    subscription.set(null);
  }
});

// Initialize the manager by subscribing to it
subscriptionManager.subscribe(() => {
  // The computed function handles all the logic
});

export async function setSeen(entityKey: string) {
  const currentUid = uid.get();
  if (!currentUid) return; // No user logged in, nothing to do

  const currentTime = Date.now();

  try {
    const { getFirestore, updateDoc, doc } = await import('firebase/firestore');
    const docRef = doc(
      getFirestore(),
      SUBSCRIPTIONS_FIRESTORE_PATH,
      currentUid,
    );

    try {
      await updateDoc(docRef, {
        [`seenEntities.${entityKey}`]: currentTime,
      });
      logDebug(
        'subscriptionStore',
        'setSeen',
        `Set seen status for ${entityKey} to ${currentTime}`,
      );
    } catch (e) {
      const error = e as { code: string };
      // If document doesn't exist, create it first
      if (error.code === 'not-found') {
        await createSubscriptionDocument(currentUid);
        await updateDoc(docRef, {
          [`seenEntities.${entityKey}`]: currentTime,
        });
        logDebug(
          'subscriptionStore',
          'setSeen',
          `Created new subscription for ${currentUid} and set seen status for ${entityKey}`,
        );
      } else {
        throw error;
      }
    }
  } catch (error) {
    logError(
      'subscriptionStore',
      'setSeen',
      `Failed to set seen status for ${entityKey}:`,
      error,
    );
  }
}

export const hasSeen = computed(subscription, (sub) => {
  if (!sub) {
    // If no subscription data, default to "Seen" to prevent "Flash of Unread"
    // Progressively enhanced features should only show notifications when data is confirmed.
    return () => true;
  }
  return (entityKey: string, flowTime: number) => {
    // If allSeenAt exists and flowTime is at or before it, item is considered seen
    if (sub.allSeenAt && flowTime <= sub.allSeenAt) {
      return true;
    }
    // Otherwise check specific entity seen status
    return (sub.seenEntities[entityKey] ?? 0) >= flowTime;
  };
});
