import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  PROFILES_COLLECTION_NAME,
  type Profile,
} from 'src/schemas/ProfileSchema';
import { db } from '..';

export async function updateProfile(data: Partial<Profile>, uid: string) {
  const profileRef = doc(db, PROFILES_COLLECTION_NAME, uid);

  const profile = {
    ...data,
    createdAt: null, // createdAt is not to be updated, so we set it to null and then prune it
    updatedAt: serverTimestamp(),
  };

  const { createdAt, ...prunedProfile } = profile;
  //logDebug('updateProfile', 'prunedProfile', prunedProfile);

  await updateDoc(profileRef, prunedProfile);
}
