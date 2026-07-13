import { where } from 'firebase/firestore';
import { atom, onMount } from 'nanostores';
import { addNotification } from 'src/firebase/client/notifications';
import {
  HANDOUTS_COLLECTION_NAME,
  type Handout,
  handoutFrom,
} from 'src/schemas/HandoutSchema';
import { SITES_COLLECTION_NAME } from 'src/schemas/SiteSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { toFirestoreEntry } from 'src/utils/client/toFirestoreEntry';
import { logDebug, logWarn } from 'src/utils/logHelpers';
import { uid } from '../session';
import { site } from '.';

export const handouts = atom([] as Handout[]);

// This is a simple store that holds a list of a site's clocks.

onMount(handouts, () => {
  const key = site.get()?.key;
  if (!key) {
    return;
  }
  subscribe(key);
});

async function subscribe(key: string) {
  const { db } = await import('../../firebase/client');
  const { collection, onSnapshot, query } = await import('firebase/firestore');

  if (site.get()?.owners.includes(uid.get())) {
    // The user is an owner of the site, so they can see all handouts
    onSnapshot(
      collection(db, SITES_COLLECTION_NAME, key, HANDOUTS_COLLECTION_NAME),
      (snapshot) => {
        const newHandouts: Handout[] = [];

        for (const change of snapshot.docChanges()) {
          if (change.type === 'removed') {
            handouts.set([
              ...handouts
                .get()
                .filter((handout) => handout.key !== change.doc.id),
            ]);
            continue;
          }
          newHandouts.push(
            handoutFrom(toClientEntry(change.doc.data()), change.doc.id, key),
          );
        }

        handouts.set(mergeHandouts(handouts.get(), newHandouts));
      },
    );
  } else {
    // We need to get the handouts that the user is in the readers ACL of the handout
    const q = query(
      collection(db, SITES_COLLECTION_NAME, key, HANDOUTS_COLLECTION_NAME),
      where('readers', 'array-contains', uid.get()),
    );
    onSnapshot(q, (snapshot) => {
      const newHandouts: Handout[] = [];

      for (const change of snapshot.docChanges()) {
        if (change.type === 'removed') {
          handouts.set([
            ...handouts
              .get()
              .filter((handout) => handout.key !== change.doc.id),
          ]);
          continue;
        }
        newHandouts.push(
          handoutFrom(toClientEntry(change.doc.data()), change.doc.id, key),
        );
      }

      handouts.set(mergeHandouts(handouts.get(), newHandouts));
    });
  }
}

function mergeHandouts(
  oldHandouts: Handout[],
  newHandouts: Handout[],
): Handout[] {
  const merged: Handout[] = [];

  for (const handout of oldHandouts) {
    const newHandout = newHandouts.find((h) => h.key === handout.key);
    if (newHandout) {
      merged.push(newHandout);
    } else {
      merged.push(handout);
    }
  }

  for (const handout of newHandouts) {
    if (!oldHandouts.find((h) => h.key === handout.key)) {
      merged.push(handout);
    }
  }

  merged.sort((a, b) => {
    return a.title.localeCompare(b.title);
  });

  return merged;
}

export async function update(handout: Partial<Handout>) {
  if (!handout.siteKey || !handout.key) {
    logWarn('Tried to update a handout without a siteKey or a key');
    return;
  }

  const entry = toFirestoreEntry(handout);

  const { updateDoc, getFirestore, doc } = await import('firebase/firestore');
  await updateDoc(
    doc(
      getFirestore(),
      SITES_COLLECTION_NAME,
      handout.siteKey,
      HANDOUTS_COLLECTION_NAME,
      handout.key,
    ),
    entry,
  );

  if (!handout.readers) return;

  // If the handout has readers, add a notification for each reader
  for (const reader of handout.readers) {
    logDebug(
      `Adding notification for reader ${reader}, handout ${handout.key}, readers: ${handout.readers}`,
    );
    if (reader !== uid.get()) {
      addNotification({
        from: uid.get(),
        to: reader,
        message: handout.title || '?',
        targetKey: `${handout.siteKey}/${handout.key}`,
        targetType: 'handout.update',
        targetTitle: handout.title || '?',
        key: `${handout.key}-${reader}`,
        createdAt: new Date(),
        read: false,
      });
    }
  }
}
