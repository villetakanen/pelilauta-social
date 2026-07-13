import { PROFILES_COLLECTION_NAME } from 'src/schemas/ProfileSchema';
import { resizeImage } from 'src/utils/client/resizeImage';
import { logError } from 'src/utils/logHelpers';

/**
 * Uploads an avatar image to the user's profile in Firebase Storage and uppdates the
 * profile in the Firestore DB with the new avatar URL.
 *
 * @param file A File object representing the avatar image to upload --> will be converted to a WebP file
 * @returns The download URL of the uploaded avatar image
 */
export async function uploadAvatar(file: File): Promise<string> {
  const { getAuth } = await import('firebase/auth');
  const uid = getAuth().currentUser?.uid;

  if (!uid) throw new Error('No user ID found, aborting');

  const resized = await resizeImage(file);

  const { getStorage, ref, uploadBytes, getDownloadURL } = await import(
    'firebase/storage'
  );

  const avatarAssetRef = ref(getStorage(), `/profiles/${uid}/avatar.webp`);

  try {
    // Upload the file
    await uploadBytes(avatarAssetRef, resized);

    // Get the download URL
    const avatarURL = await getDownloadURL(avatarAssetRef);

    // Save the Avatar URL to the user's profile
    const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
    updateDoc(doc(getFirestore(), PROFILES_COLLECTION_NAME, uid), {
      avatarURL,
    });

    return avatarURL;
  } catch (error) {
    logError('Error uploading asset to storage', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
