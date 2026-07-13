import { persistentAtom } from '@nanostores/persistent';
import { type Atom, atom, computed } from 'nanostores';
import { type Site, SiteSchema } from 'src/schemas/SiteSchema';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';
import { z } from 'zod';

const sitesStorageSchema = z.array(SiteSchema);

// Cache for individual site computed atoms
const siteAtomsCache = new Map<string, Atom<Site | null>>();

export const sitesStorage = persistentAtom<Site[]>('local-sites', [], {
  encode: JSON.stringify,
  decode: (data) => {
    if (!data || data === 'null') return [];
    try {
      return sitesStorageSchema.parse(JSON.parse(data));
    } catch (error) {
      logError('sitesStore', 'Failed to parse sites data:', error);
      return [];
    }
  },
});

export const loading = atom<string[]>([]);

/**
 * Fetches a site from the API and updates local storage
 */
async function fetchSite(key: string): Promise<void> {
  try {
    // Add to loading array
    const currentLoading = loading.get();
    if (!currentLoading.includes(key)) {
      loading.set([...currentLoading, key]);
    }

    logDebug('sitesStore', `Fetching site: ${key}`);

    const response = await fetch(`/api/sites/${key}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch site: ${response.status}`);
    }

    const siteData = await response.json();
    const site = SiteSchema.parse(siteData);

    // Update sitesStorage with the new/updated site
    const currentSites = sitesStorage.get();
    const existingIndex = currentSites.findIndex((s) => s.key === key);

    if (existingIndex >= 0) {
      // Update existing site
      const updatedSites = [...currentSites];
      updatedSites[existingIndex] = site;
      sitesStorage.set(updatedSites);
    } else {
      // Add new site
      sitesStorage.set([...currentSites, site]);
    }

    logDebug('sitesStore', `Successfully updated site: ${key}`);
  } catch (error) {
    logWarn('sitesStore', `Failed to fetch site ${key}:`, error);
  } finally {
    // Remove from loading array
    const currentLoading = loading.get();
    loading.set(currentLoading.filter((loadingKey) => loadingKey !== key));
  }
}

/**
 * Returns a "stale while revalidate" store for a site.
 *
 * @param key
 */
export function getSite(key: string): Atom<Site | null> {
  // Check if we already have a computed atom for this site
  let siteAtom = siteAtomsCache.get(key);

  if (!siteAtom) {
    // Create a computed atom that tracks the specific site in sitesStorage
    siteAtom = computed(sitesStorage, (sites) => {
      return sites.find((site) => site.key === key) || null;
    });
    siteAtomsCache.set(key, siteAtom);
  }

  // Check if we need to fetch the site
  const currentSites = sitesStorage.get();
  const currentLoading = loading.get();
  const siteExists = currentSites.some((site) => site.key === key);
  const isLoading = currentLoading.includes(key);

  // Only trigger fetch if site doesn't exist and we're not already loading it
  if (!siteExists && !isLoading) {
    fetchSite(key);
  }

  return siteAtom;
}

/**
 * Updates a site in the local store.
 * This is useful for optimistic updates or when we know the data has changed.
 *
 * @param key The key of the site to update
 * @param data The partial site data to merge
 */
export function updateSite(key: string, data: Partial<Site>): void {
  const currentSites = sitesStorage.get();
  const index = currentSites.findIndex((s) => s.key === key);

  if (index >= 0) {
    const updatedSites = [...currentSites];
    updatedSites[index] = { ...updatedSites[index], ...data };
    sitesStorage.set(updatedSites);
    logDebug('sitesStore', `Updated local site state: ${key}`);
  }
}
