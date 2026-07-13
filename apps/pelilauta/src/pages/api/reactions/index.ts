import type { APIContext } from 'astro';
import type { DocumentReference } from 'firebase-admin/firestore';
import {
  NOTIFICATION_FIRESTORE_COLLECTION,
  type NotificationRequest,
} from 'src/schemas/NotificationSchema';
import {
  REACTIONS_COLLECTION_NAME,
  type Reactions,
  reactionsSchema,
} from 'src/schemas/ReactionsSchema';
import { REPLIES_COLLECTION } from 'src/schemas/ReplySchema';
import { SITES_COLLECTION_NAME } from 'src/schemas/SiteSchema';
import { THREADS_COLLECTION_NAME } from 'src/schemas/ThreadSchema';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';
import { tokenToUid } from 'src/utils/server/auth/tokenToUid';
import { z } from 'zod';

export const reactionRequestSchema = z.object({
  key: z.string().min(1), // The target entry key
  type: z.enum(['love']).default('love'), // Reaction type
  target: z.enum(['thread', 'site', 'reply']), // Target type for notifications
  title: z.string().optional(), // Target title for notifications
});

export type ReactionRequest = z.infer<typeof reactionRequestSchema>;

interface ReactionResponse {
  success: boolean;
  reactions?: Reactions;
  error?: string;
}

export async function POST(context: APIContext): Promise<Response> {
  try {
    // 1. Authenticate the request
    const uid = await tokenToUid(context.request);
    if (!uid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 2. Parse and validate the request body
    const body = await context.request.json();
    const request = reactionRequestSchema.parse(body);

    logDebug(
      'ReactionsAPI',
      `Processing ${request.type} reaction for ${request.key} by ${uid}`,
    );

    // 3. Get or create reactions document
    const { serverDB } = await import('../../../firebase/server');
    const reactionsRef = serverDB
      .collection(REACTIONS_COLLECTION_NAME)
      .doc(request.key);
    const reactionsDoc = await reactionsRef.get();

    let currentReactions: Reactions;
    if (reactionsDoc.exists) {
      currentReactions = reactionsSchema.parse(reactionsDoc.data());
    } else {
      // Create new reactions document with empty subscribers array
      const owners = await getTargetEntryOwners(request.target, request.key);
      currentReactions = { subscribers: [...owners] };
      logDebug(
        'ReactionsAPI',
        `Creating new reactions document for ${request.key}`,
      );
    }

    // 4. Toggle the reaction
    const reactionArray = [...(currentReactions[request.type] || [])];
    const userIndex = reactionArray.indexOf(uid);
    const wasAdded = userIndex === -1;

    if (wasAdded) {
      reactionArray.push(uid);
      logDebug('ReactionsAPI', `Added ${request.type} reaction for ${uid}`);
    } else {
      reactionArray.splice(userIndex, 1);
      logDebug('ReactionsAPI', `Removed ${request.type} reaction for ${uid}`);
    }

    // 5. Update the reactions document
    const updatedReactions: Reactions = {
      ...currentReactions,
      [request.type]: reactionArray,
    };

    await reactionsRef.set(updatedReactions);

    // 6. Send notifications if reaction was added and there are subscribers
    if (wasAdded && currentReactions.subscribers.length > 0) {
      await sendReactionNotification(
        currentReactions.subscribers,
        uid,
        request.key,
        request.target,
        request.title,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        reactions: updatedReactions,
      } as ReactionResponse),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logWarn('ReactionsAPI', 'Invalid request body:', error.issues);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request format',
        } as ReactionResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    logError('ReactionsAPI', 'Failed to process reaction:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      } as ReactionResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

async function sendReactionNotification(
  subscribers: string[],
  fromUid: string,
  targetKey: string,
  target: 'thread' | 'site' | 'reply',
  title?: string,
): Promise<void> {
  try {
    const notification: NotificationRequest = {
      notification: {
        key: '',
        targetType: `${target}.loved`,
        targetKey: targetKey,
        targetTitle: title || targetKey,
      },
      recipients: subscribers,
      from: fromUid,
    };

    // We could call the notification API directly here, but for now let's
    // inline the notification creation to avoid circular dependencies
    const { serverDB } = await import('../../../firebase/server');
    const { FieldValue } = await import('firebase-admin/firestore');

    const base = notification.notification;

    for (const recipient of notification.recipients) {
      // Skip self-notifications
      if (fromUid === recipient) {
        continue;
      }

      const n = {
        ...base,
        key: `${base.targetKey}-${base.targetType}-${fromUid}-${recipient}`,
        createdAt: FieldValue.serverTimestamp(),
        to: recipient,
        from: fromUid,
        read: false,
      };

      try {
        await serverDB
          .collection(NOTIFICATION_FIRESTORE_COLLECTION)
          .doc(n.key)
          .set(n);
        logDebug('ReactionsAPI', `Notification sent to ${recipient}`);
      } catch (error) {
        logError(
          'ReactionsAPI',
          `Failed to send notification to ${recipient}:`,
          error,
        );
      }
    }
  } catch (error) {
    // Log but don't throw - notifications are non-critical
    logWarn('ReactionsAPI', 'Failed to send notifications:', error);
  }
}

async function getTargetEntryOwners(
  target: 'thread' | 'site' | 'reply',
  key: string,
): Promise<string[]> {
  const { serverDB } = await import('../../../firebase/server');

  let docRef: null | DocumentReference;
  switch (target) {
    case 'thread':
      docRef = serverDB.collection(THREADS_COLLECTION_NAME).doc(key);
      break;
    case 'site':
      docRef = serverDB.collection(SITES_COLLECTION_NAME).doc(key);
      break;
    case 'reply': {
      const REPLY_KEY_PARTS_COUNT = 2;
      const parts = key.split('-');
      if (parts.length !== REPLY_KEY_PARTS_COUNT || !parts[0] || !parts[1]) {
        logError('ReactionsAPI', 'Invalid reply key format:', key);
        return [];
      }
      const [threadKey, replyKey] = parts;
      docRef = serverDB
        .collection(THREADS_COLLECTION_NAME)
        .doc(threadKey)
        .collection(REPLIES_COLLECTION)
        .doc(replyKey);
      break;
    }
    default:
      logError('ReactionsAPI', 'Invalid target type:', target);
      return [];
  }

  const doc = await docRef.get();
  if (!doc.exists) {
    return [];
  }

  const data = doc.data();
  return data?.owners || [];
}
