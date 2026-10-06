import { uid } from '@pelilauta/stores/session';
import { isResolvedActive } from '@pelilauta/stores/session/computed';
import { atom, computed, onMount } from 'nanostores';
import {
  NOTIFICATION_FIRESTORE_COLLECTION,
  type Notification,
  parseNotification,
} from 'src/schemas/NotificationSchema';
import { logError } from 'src/utils/logHelpers';

export const notifications = atom<Notification[]>([]);

export const newCount = computed(notifications, (notifications) => {
  return notifications.filter((notification) => !notification.read).length;
});

const recipient = computed([uid, isResolvedActive], (key, resolved) =>
  resolved ? key : '',
);

onMount(notifications, () => {
  // Discard the legacy cache shared by every reader of this browser.
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('notifications');
    } catch (error) {
      logError('inboxStore', 'Could not discard the legacy inbox cache', error);
    }
  }

  let generation = 0;
  let unsubscribe = () => {};

  const stopRecipient = recipient.subscribe((key) => {
    const current = ++generation;
    unsubscribe();
    unsubscribe = () => {};
    notifications.set([]);
    if (!key) return;

    const isCurrent = () => current === generation && recipient.get() === key;

    async function subscribe() {
      const {
        getFirestore,
        onSnapshot,
        query,
        collection,
        where,
        orderBy,
        limit,
      } = await import('firebase/firestore');
      if (!isCurrent()) return;

      const q = query(
        collection(getFirestore(), NOTIFICATION_FIRESTORE_COLLECTION),
        where('to', '==', key),
        orderBy('createdAt', 'desc'),
        limit(10),
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isCurrent()) return;
          notifications.set(
            snapshot.docs.map((doc) => parseNotification(doc.data(), doc.id)),
          );
        },
        (error) => {
          if (!isCurrent()) return;
          notifications.set([]);
          logError('inboxStore', 'Notification subscription failed', error);
        },
      );
    }

    void subscribe().catch((error) => {
      if (isCurrent()) {
        logError('inboxStore', 'Notification subscription failed', error);
      }
    });
  });

  return () => {
    ++generation;
    stopRecipient();
    unsubscribe();
    notifications.set([]);
  };
});
