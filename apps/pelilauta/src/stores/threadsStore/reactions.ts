import {
  doc,
  increment,
  runTransaction,
  type Transaction,
} from 'firebase/firestore';
import { db } from '../../firebase/client';

/**
 * Given   I am logged in
 *   And   Have a profile
 *   And   A post is not loved by me
 *         (and, thus) The post exists
 *  When   I click love on a post
 *  Then   // The thread is loved visually
 *   And   The thread loved count++
 *   And   The thread is added to my loved threads
 *
 * @param uid Firebase user UID, with a valid profile data in /database/profiles/{uid}
 * @param threadid The id of a Stream Thread, found in /database/stream/{threadid}
 */
export async function loveThread(uid: string, threadid: string): Promise<void> {
  const threadRef = doc(db, 'stream', threadid);
  const profileRef = doc(db, 'profiles', uid);

  return runTransaction(db, async (transaction: Transaction) => {
    const profile = await transaction.get(profileRef);
    if (!profile.exists) {
      throw new Error(
        `threadStore/loveThread, trying to love by a non existing user (${uid})`,
      );
    }
    const lovesArr: string[] = [];
    const dataArr = profile.data()?.lovedThreads;
    if (dataArr) {
      if ((dataArr as Array<string>).includes(threadid)) {
        throw new Error('Can not love a tread one already loves');
      }
      for (const loved of dataArr as Array<string>) {
        lovesArr.push(loved);
      }
    }
    lovesArr.push(threadid);
    transaction.update(profileRef, { lovedThreads: lovesArr });
    transaction.update(threadRef, {
      lovedCount: increment(1),
    });
  });
}

/**
 * See loveThread for more info, undoes it
 *
 * @param uid Firebase user UID, with a valid profile data in /database/profiles/{uid}
 * @param threadid The id of a Stream Thread, found in /database/stream/{threadid}
 */
export async function unloveThread(
  uid: string,
  threadid: string,
): Promise<void> {
  const threadRef = doc(db, 'stream', threadid);
  const profileRef = doc(db, 'profiles', uid);

  return runTransaction(db, async (transaction: Transaction) => {
    const profile = await transaction.get(profileRef);
    if (!profile.exists) {
      throw new Error(
        `threadStore/loveThread, trying to unlove by a non existing user (${uid})`,
      );
    }
    const lovesArr: string[] = [];
    const dataArr = profile.data()?.lovedThreads;
    if (dataArr) {
      if (!(dataArr as Array<string>).includes(threadid)) {
        throw new Error('Can not de-love a tread one not-loves');
      }
      for (const loved of dataArr as Array<string>) {
        if (loved !== threadid) {
          lovesArr.push(loved);
        }
      }
    }
    transaction.update(profileRef, { lovedThreads: lovesArr });
    transaction.update(threadRef, {
      lovedCount: increment(-1),
    });
  });
}
