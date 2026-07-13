import { persistentAtom } from '@nanostores/persistent';
import { computed, onMount, onStop } from 'nanostores';
import {
  NOTIFICATION_FIRESTORE_COLLECTION,
  type Notification,
  parseNotification,
} from 'src/schemas/NotificationSchema';
import { logDebug } from 'src/utils/logHelpers';
import { uid } from '../session';

export const notifications = persistentAtom<Notification[]>(
  'notifications',
  [],
  {
    encode: JSON.stringify,
    decode: (data) => {
      return JSON.parse(data).map((entry: Record<string, unknown>) => {
        return parseNotification(entry, entry.key as string);
      });
    },
  },
);

export const newCount = computed(notifications, (notifications) => {
  return notifications.filter((notification) => !notification.read).length;
});

let unsubscribe = () => {};

onMount(notifications, () => {
  const key = uid.get();
  // If we have no uid, we don't need to load notifications
  if (!key) return;

  // Start listening for notifications
  logDebug('Notifications mounted');
  subscribeToNotifications(key);
});

onStop(notifications, () => {
  unsubscribe();
  logDebug('Notifications stopped');
});

async function subscribeToNotifications(key: string) {
  unsubscribe();

  const { getFirestore, onSnapshot, query, collection, where, orderBy, limit } =
    await import('firebase/firestore');

  const q = query(
    collection(getFirestore(), NOTIFICATION_FIRESTORE_COLLECTION),
    where('to', '==', key),
    orderBy('createdAt', 'desc'),
    limit(10),
  );

  let initial = true;

  unsubscribe = onSnapshot(q, (snapshot) => {
    // If this is the first snapshot, we need to refresh the
    // local copy of notifications (to remove any stale data)
    if (initial) {
      initial = false;
      const online = snapshot.docChanges();
      const local: Notification[] = [];

      for (const change of online) {
        local.push(parseNotification(change.doc.data(), change.doc.id));
      }

      notifications.set(local);
      return;
    }

    // Otherwise, we need to update the local copy of notifications,
    // by adding, modifying, or removing notifications as needed
    for (const change of snapshot.docChanges()) {
      if (change.type === 'removed') {
        popNotification(change.doc.id);
      }
      if (change.type === 'added' || change.type === 'modified') {
        patchNotification(change.doc.id, change.doc.data());
      }
    }
  });
}

function popNotification(key: string) {
  const current = notifications.get();
  notifications.set(current.filter((n) => n.key !== key));
}

function patchNotification(key: string, data: Record<string, unknown>) {
  const current = [...notifications.get()];
  const index = current.findIndex((n) => n.key === key);

  if (index === -1) {
    current.push(parseNotification(data, key));
  } else {
    current[index] = parseNotification(data, key);
  }

  current.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  notifications.set(current);
}
