import type { APIContext } from 'astro';
import {
  NOTIFICATION_FIRESTORE_COLLECTION,
  type NotificationRequest,
  NotificationRequestSchema,
} from 'src/schemas/NotificationSchema';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';
import { tokenToUid } from 'src/utils/server/auth/tokenToUid';
import { ZodError } from 'zod';

async function createNotificationEntries(
  request: NotificationRequest,
): Promise<{ success: number; failed: number }> {
  const { serverDB } = await import('../../../firebase/server');
  const { FieldValue } = await import('firebase-admin/firestore');
  const base = request.notification;
  let successCount = 0;
  let failedCount = 0;

  for (const recipient of request.recipients) {
    // Skip self-notifications
    if (request.from === recipient) {
      continue;
    }

    // Note: we will not validate this schema after this, as
    // the NotificationSchema is a client-side schema with Date's in place
    // of Firestore Timestamps.
    const n = {
      ...base,
      key: `${base.targetKey}-${base.targetType}-${request.from}-${recipient}`,
      createdAt: FieldValue.serverTimestamp(),
      to: recipient,
      from: request.from,
      read: false,
    };

    try {
      await serverDB
        .collection(NOTIFICATION_FIRESTORE_COLLECTION)
        .doc(n.key)
        .set(n);
      successCount++;
    } catch (error) {
      failedCount++;
      logError(
        'createNotificationEntries',
        `Failed to create notification for recipient ${recipient}:`,
        error,
      );
    }
  }

  return { success: successCount, failed: failedCount };
}

export async function POST({ request }: APIContext): Promise<Response> {
  const endpointName = '/api/notifications/send';

  try {
    const uid = await tokenToUid(request);

    if (!uid) {
      logWarn(endpointName, 'Authentication failed: Invalid or missing token');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or missing token',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        },
      );
    }

    try {
      const rawData = await request.json();
      const notificationRequest = NotificationRequestSchema.parse(rawData.body);
      notificationRequest.from = uid;

      logDebug(
        endpointName,
        `Processing notification request for ${notificationRequest.recipients.length} recipients`,
      );

      const results = await createNotificationEntries(notificationRequest);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Notifications processed successfully',
          sent: results.success,
          failed: results.failed,
          total: notificationRequest.recipients.length,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        },
      );
    } catch (error) {
      if (error instanceof ZodError) {
        logWarn(endpointName, 'Invalid notification data:', error.issues);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid notification data',
            details: error.issues,
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          },
        );
      }

      logError(endpointName, 'Error processing notification request:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to process notification request',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        },
      );
    }
  } catch (error) {
    logError(endpointName, 'Authentication error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Authentication failed',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      },
    );
  }
}
