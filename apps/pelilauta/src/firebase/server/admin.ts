import { AppMetaSchema } from '@schemas/AppMetaSchema';
import { logError } from '@utils/logHelpers';
import { serverDB } from './index';

/**
 * Checks if a user has admin privileges.
 * @param uid The user's ID.
 * @returns A promise that resolves to true if the user is an admin, false otherwise.
 */
export async function isAdmin(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const metaDoc = await serverDB.collection('meta').doc('pelilauta').get();

    if (!metaDoc.exists) {
      return false;
    }

    const metaData = AppMetaSchema.parse(metaDoc.data());
    return metaData.admins.includes(uid);
  } catch (error) {
    logError('isAdmin', 'Failed to check admin status:', error);
    return false;
  }
}
