import { collection, getDocs, query, where } from 'firebase/firestore';
import { PROFILES_COLLECTION_NAME } from 'src/schemas/ProfileSchema';
import {
  type PublicProfile,
  PublicProfileSchema,
} from '../../../stores/profiles';
import { db } from '..';

export async function getProfileByNick(
  nick: string,
): Promise<PublicProfile | undefined> {
  const nickQuery = query(
    collection(db, PROFILES_COLLECTION_NAME),
    where('nick', '==', nick),
  );
  const snapshot = await getDocs(nickQuery);
  if (snapshot.docs.length === 0) {
    return;
  }
  const profileDoc = snapshot.docs[0];

  return PublicProfileSchema.parse({
    ...profileDoc.data(),
  });
}
