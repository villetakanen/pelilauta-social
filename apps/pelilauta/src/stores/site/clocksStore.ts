import { atom, onMount } from 'nanostores';
import {
  CLOCKS_COLLECTION_NAME,
  type Clock,
  parseClock,
} from 'src/schemas/ClockSchema';
import { SITES_COLLECTION_NAME } from 'src/schemas/SiteSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { site } from '.';

export const clocks = atom<Clock[]>([]);
export const loading = atom<boolean>(true);

// This is a simple store that holds a list of a site's clocks.

onMount(clocks, () => {
  const key = site.get()?.key;
  if (!key) {
    return;
  }
  subscribe(key);
});

async function subscribe(key: string) {
  const { db } = await import('../../firebase/client');
  const { collection, onSnapshot } = await import('firebase/firestore');

  onSnapshot(
    collection(db, SITES_COLLECTION_NAME, key, CLOCKS_COLLECTION_NAME),
    (snapshot) => {
      if (snapshot.empty) {
        clocks.set([]);
        loading.set(false);
        return;
      }
      const newClocks: Clock[] = [];

      for (const change of snapshot.docChanges()) {
        if (change.type === 'removed') {
          clocks.set([
            ...clocks.get().filter((clock) => clock.key !== change.doc.id),
          ]);
          continue;
        }
        newClocks.push(
          parseClock(toClientEntry(change.doc.data()), change.doc.id),
        );
      }

      clocks.set(mergeClocks(clocks.get(), newClocks));
      loading.set(false);
    },
  );
}

function mergeClocks(c: Array<Clock>, newClocks: Array<Clock>) {
  const merged = new Map<string, Clock>();
  for (const clock of c) {
    merged.set(clock.key, clock);
  }
  for (const clock of newClocks) {
    merged.set(clock.key, clock);
  }
  return Array.from(merged.values());
}

export async function updateClock(data: Partial<Clock>) {
  const { key: siteKey } = site.get() || {};
  const { key, stage } = data;
  if (!siteKey || !key || !stage) {
    return;
  }
  const { getFirestore, doc, updateDoc } = await import('firebase/firestore');

  await updateDoc(
    doc(
      getFirestore(),
      SITES_COLLECTION_NAME,
      siteKey,
      CLOCKS_COLLECTION_NAME,
      key,
    ),
    { stage },
  );
}
