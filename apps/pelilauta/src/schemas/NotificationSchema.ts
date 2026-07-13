import { toDate } from 'src/utils/schemaHelpers';
import { z } from 'zod';

export const NOTIFICATION_FIRESTORE_COLLECTION = 'notifications';

const TargetTypeEnum = z.enum([
  'thread', // key -> thread.key
  'thread.reply', // key -> thread.key/reply.key
  'thread.loved', // key -> thread.key
  'reply.loved', // key -> thread.key/reply.key
  'site.loved', // key -> site.key
  'site.invited', // key -> site.key
  'page.loved', // key -> site.key/page.key
  'handout.update', // key -> site.key/handout.key
]);

const NotificationBaseSchema = z.object({
  key: z.string().default(''),
  message: z.string().optional(),
  targetKey: z.string(), // This is alaways required
  targetType: TargetTypeEnum,
  targetTitle: z.string().default('-'),
});

export const NotificationSchema = NotificationBaseSchema.extend({
  createdAt: z.date(),
  from: z.string(),
  to: z.string(),
  read: z.boolean(),
});

export const NotificationRequestSchema = z.object({
  notification: NotificationBaseSchema,
  recipients: z.array(z.string()),
  from: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationRequest = z.infer<typeof NotificationRequestSchema>;

export function parseNotification(
  n: Partial<Notification>,
  key?: string,
): Notification {
  const from =
    typeof n.from === 'string'
      ? n.from
      : Array.isArray(n.from)
        ? `${n.from[0]}`
        : '';

  return NotificationSchema.parse({
    ...n,
    key: key || n.key || '',
    createdAt: toDate(n.createdAt),
    read: n.read || false,
    targetTitle: n.targetTitle || '-',
    from,
  });
}
