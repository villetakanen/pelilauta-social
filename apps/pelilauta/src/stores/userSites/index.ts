import { persistentAtom } from '@nanostores/persistent';
import { computed, type WritableAtom } from 'nanostores';
import {
  SITES_COLLECTION_NAME,
  type Site,
  SiteSchema,
} from 'src/schemas/SiteSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { logDebug, logError } from 'src/utils/logHelpers';
import { z } from 'zod';
import { uid } from '../session';
import { isResolvedActive } from '../session/computed';

/**
 * A nanostore for caching the user's sites.
 */
export const userSites: WritableAtom<Site[]> = persistentAtom(
  'user-site-cache',
  [],
  {
    encode: JSON.stringify,
    decode: (data) => {
      try {
        const parsed = JSON.parse(data);
        // Validate the data from localStorage against the schema
        const validationResult = z.array(SiteSchema).safeParse(parsed);
        if (validationResult.success) {
          return validationResult.data;
        }
        logError(
          'userSites:decode',
          'Invalid data in localStorage',
          validationResult.error,
        );
        return []; // Return default value on validation failure
      } catch (error) {
        logError(
          'userSites:decode',
          'Failed to parse data from localStorage',
          error,
        );
        return []; // Return default value on parsing failure
      }
    },
  },
);

let refresh = 0;

computed([isResolvedActive, uid], (active, currentUid) => ({
  active,
  currentUid,
})).subscribe(({ active, currentUid }) => {
  refresh++;
  if (!currentUid || active) userSites.set([]);
  if (active && currentUid) void refreshSites(currentUid);
});

export async function refreshSites(currentUid: string) {
  const started = ++refresh;
  const current = () =>
    started === refresh && isResolvedActive.get() && uid.get() === currentUid;
  if (!current()) return;
  logDebug('userSites:refreshSites', 'Refreshing sites for user', {
    currentUid,
  });
  try {
    const { getFirestore, getDocs, query, where, collection } = await import(
      'firebase/firestore'
    );
    if (!current()) return;
    const db = getFirestore();

    // Fetch sites where user is an owner
    const ownerQuery = query(
      collection(db, SITES_COLLECTION_NAME),
      where('owners', 'array-contains', currentUid),
    );

    // Fetch sites where user is a player
    const playerQuery = query(
      collection(db, SITES_COLLECTION_NAME),
      where('players', 'array-contains', currentUid),
    );

    const [ownerDocs, playerDocs] = await Promise.all([
      getDocs(ownerQuery),
      getDocs(playerQuery),
    ]);

    if (!current()) return;
    const sitesMap = new Map<string, Site>();

    for (const doc of ownerDocs.docs) {
      const site = SiteSchema.parse({
        ...toClientEntry(doc.data()),
        key: doc.id,
      });
      sitesMap.set(site.key, site);
    }

    for (const doc of playerDocs.docs) {
      const site = SiteSchema.parse({
        ...toClientEntry(doc.data()),
        key: doc.id,
      });
      if (!sitesMap.has(site.key)) {
        sitesMap.set(site.key, site);
      }
    }

    const sitesArray = Array.from(sitesMap.values());
    userSites.set(sitesArray);
    logDebug('userSites:refreshSites', 'Successfully refreshed sites', {
      count: sitesArray.length,
    });
  } catch (error) {
    logError(
      'userSites:refreshSites',
      'Failed to refresh sites from Firestore',
      error,
    );
  }
}
