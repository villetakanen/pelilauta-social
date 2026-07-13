import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  PROFILES_COLLECTION_NAME,
  type Profile,
} from 'src/schemas/ProfileSchema';
import { db } from '..';

export async function createProfile(data: Partial<Profile>, uid: string) {
  const profileRef = doc(db, PROFILES_COLLECTION_NAME, uid);

  // Check if the profile already exists, throw an error if it does
  if ((await getDoc(profileRef)).exists()) {
    throw new Error('Profile already exists');
  }

  const nickQuery = query(
    collection(db, PROFILES_COLLECTION_NAME),
    where('nick', '==', data.nick),
  );
  if ((await getDocs(nickQuery)).docs.length > 0) {
    throw new Error('Profile with the same nick already exists');
  }

  const profile = {
    ...data,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(profileRef, profile);
}
