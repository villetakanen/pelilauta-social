import { NOTIFICATION_FIRESTORE_COLLECTION } from 'src/schemas/NotificationSchema';

export async function deleteNotification(key: string) {
  const { getFirestore, doc, deleteDoc } = await import('firebase/firestore');
  const db = getFirestore();
  const notificationDoc = doc(db, NOTIFICATION_FIRESTORE_COLLECTION, key);
  await deleteDoc(notificationDoc);
}
