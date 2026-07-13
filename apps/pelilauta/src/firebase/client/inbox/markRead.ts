import { NOTIFICATION_FIRESTORE_COLLECTION } from 'src/schemas/NotificationSchema';
import { logDebug } from 'src/utils/logHelpers';

export async function markRead(key: string, read: boolean) {
  const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
  const db = getFirestore();
  const notificationDoc = doc(db, NOTIFICATION_FIRESTORE_COLLECTION, key);
  logDebug(
    'src/firebase/client/inbox/markRead',
    `Marking notification ${key} as read: ${read}`,
  );
  await updateDoc(notificationDoc, { read });
}
