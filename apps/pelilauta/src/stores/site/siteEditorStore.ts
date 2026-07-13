import type { Site } from '@schemas/SiteSchema';
import { logDebug, logError } from '@utils/logHelpers';
import { atom, computed } from 'nanostores';

const originalSite = atom<Site | null>(null);
export const activeSite = atom<Site | null>(null);
export const isSaving = atom(false);

export const dirty = computed(
  [originalSite, activeSite],
  (original, active) => {
    if (!original || !active) return false;
    return JSON.stringify(original) !== JSON.stringify(active);
  },
);

export function init(site: Site) {
  originalSite.set(site);
  activeSite.set(site);
}

export function reset() {
  const original = originalSite.get();
  if (original) {
    activeSite.set(original);
  }
}

/**
 * Optimistically updates the site data. Updates the local store immediately
 * for instant preview, then persists via API endpoint which handles validation,
 * authorization, and atomic cache purging.
 *
 * If the update fails, the local store is rolled back to the previous state.
 *
 * Note: The API endpoint performs partial updates (PATCH semantics), so only
 * the changed fields need to be sent.
 *
 * @param updates - Partial Site object with fields to update
 */
export async function updateSite(updates: Partial<Site>): Promise<void> {
  const currentSite = activeSite.get();

  if (!currentSite) {
    logError('siteEditorStore', 'Cannot update: no site loaded');
    throw new Error('No site loaded in editor');
  }

  // Ensure key cannot be changed
  if (updates.key && updates.key !== currentSite.key) {
    logError('siteEditorStore', 'Cannot change site key');
    throw new Error('Site key cannot be changed');
  }

  // Store the previous state for rollback
  const previousSite = { ...currentSite };

  // Optimistically update the local store immediately for instant preview
  const optimisticSite: Site = {
    ...currentSite,
    ...updates,
    key: currentSite.key, // Ensure key stays the same
  };

  activeSite.set(optimisticSite);
  isSaving.set(true);

  logDebug('siteEditorStore:update', 'Optimistic update applied', updates);

  try {
    // Dynamic import of the API wrapper for code splitting
    const { updateSiteApi } = await import(
      '@firebase/client/site/updateSiteApi'
    );

    // Call API endpoint with the updates
    // silent=true prevents timestamp updates (metadata-only changes)
    // Cache purging happens server-side automatically
    await updateSiteApi(
      {
        key: currentSite.key,
        ...updates,
      },
      true, // silent - no timestamp update for form edits
    );

    logDebug('siteEditorStore:update', 'API update completed');
  } catch (error) {
    // Rollback to previous state on error
    logError('siteEditorStore:update', 'Update failed, rolling back', error);
    activeSite.set(previousSite);
    throw error;
  } finally {
    isSaving.set(false);
    originalSite.set(activeSite.get()); // Sync original to current after save attempt
  }
}
