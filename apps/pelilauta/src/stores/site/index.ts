import { type Site, SiteSchema } from '@schemas/SiteSchema';
import { uid } from '@stores/session';
import { toClientEntry } from '@utils/client/entryUtils';
import { logDebug, logError, logWarn } from '@utils/logHelpers';
import { atom, onMount, onSet } from 'nanostores';
import { updateSiteApi } from 'src/firebase/client/site/updateSiteApi';

export const site = atom<Site | null>(null);
export const isPreSeeded = atom<boolean>(false);

let unsubscribe: (() => void) | null = null;
let currentSubscriptionKey: string | null = null;

// Runs when the store gets its first subscriber on the client
onMount(site, () => {
  logDebug('siteStore:onMount', 'Site store is now active on the client.');

  // Subscribe to auth changes to dynamically manage real-time updates
  const unbindUid = uid.subscribe((currentUid) => {
    const currentSite = site.get();
    if (currentSite) {
      handleSubscription(currentSite, !!currentUid);
    }
  });

  // Cleanup when the store is no longer used
  return () => {
    logDebug('siteStore:onMount', 'Site store cleanup initiated.');
    unbindUid();
    cleanupSubscription();
  };
});

// Runs every time `site.set()` is called
onSet(site, ({ newValue }) => {
  const currentUid = uid.get();
  handleSubscription(newValue, !!currentUid);
});

async function handleSubscription(
  currentSite: Site | null,
  isAuthenticated: boolean,
) {
  // Clean up previous subscription if site changed or user logged out
  if (
    currentSubscriptionKey &&
    (!currentSite || currentSite.key !== currentSubscriptionKey)
  ) {
    cleanupSubscription();
  }

  // Only subscribe if authenticated, site exists, and not already subscribed
  if (
    !isAuthenticated ||
    !currentSite ||
    currentSubscriptionKey === currentSite.key
  ) {
    return;
  }

  try {
    logDebug(
      'siteStore:handleSubscription',
      'Starting real-time subscription for site:',
      currentSite.key,
    );

    // Dynamic Firebase imports per coding guidelines
    const [{ db }, { doc, onSnapshot }] = await Promise.all([
      import('@firebase/client'),
      import('firebase/firestore'),
    ]);

    currentSubscriptionKey = currentSite.key;

    unsubscribe = onSnapshot(
      doc(db, 'sites', currentSite.key),
      (doc) => {
        if (doc.exists()) {
          const updatedSite = SiteSchema.parse({
            ...toClientEntry(doc.data()),
            key: currentSite.key,
          });

          // Prevent infinite loops by checking for actual changes
          const currentSiteData = site.get();
          if (
            !currentSiteData ||
            JSON.stringify(currentSiteData) !== JSON.stringify(updatedSite)
          ) {
            logDebug(
              'siteStore',
              'Real-time update received for site:',
              currentSite.key,
            );
            site.set(updatedSite);
          }
        } else {
          logDebug('siteStore', 'Site document deleted:', currentSite.key);
          site.set(null);
        }
      },
      (error) => {
        logError(
          'siteStore:subscription',
          'Firestore subscription error:',
          error,
        );
        cleanupSubscription();
      },
    );
  } catch (error) {
    logError(
      'siteStore:handleSubscription',
      'Failed to setup subscription:',
      error,
    );
    cleanupSubscription();
  }
}

function cleanupSubscription() {
  if (unsubscribe) {
    logDebug(
      'siteStore:cleanup',
      'Cleaning up subscription for:',
      currentSubscriptionKey,
    );
    unsubscribe();
    unsubscribe = null;
  }
  currentSubscriptionKey = null;
}

export async function update(data: Partial<Site>) {
  const key = site.get()?.key;
  if (!key) {
    logWarn('Site key is required to update the site data, aborting');
    return;
  }
  // Merge the updates with the current site data
  // updateSite will handle the actual update. Note: site Key
  // is required for the update to work. It also can't be updated
  // for obvious reasons.
  const updated = { ...site.get(), ...data, key };
  // Silent update of the Site Data
  logDebug('Updating site data', updated);
  await updateSiteApi(updated, true);
}

// Export import store
export * from './importsStore';
