import type { Notification } from 'src/schemas/NotificationSchema';

/**
 * Where a notification links to, or undefined when it links nowhere.
 * A reply notification carries `thread/reply`; one carrying the thread key
 * alone lands at the discussion.
 */
export function notificationHref(
  notification: Pick<Notification, 'targetType' | 'targetKey'>,
): string | undefined {
  const { targetType, targetKey } = notification;
  if (targetType === 'thread.loved') return `/threads/${targetKey}`;
  if (targetType === 'site.invited') return `/sites/${targetKey}`;
  if (targetType === 'site.loved') return `/sites/${targetKey}`;
  if (targetType === 'thread.reply') {
    const [thread, reply] = targetKey.split('/');
    return `/threads/${thread}#${reply || 'discussion'}`;
  }
  if (targetType.startsWith('handout.')) {
    const keys = targetKey.split('/');
    return `/sites/${keys[0]}/handouts/${keys[1]}`;
  }
  return undefined;
}
