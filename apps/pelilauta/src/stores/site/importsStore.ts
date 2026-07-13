/**
 * This is a nanostore used by the import app, to manage the pre-processing of imported pages
 * to a site.
 *
 * It automatically determines if pages should be created or overwritten based on existing
 * page names, and provides functionality to preview and manage the import batch.
 */

import { atom } from 'nanostores';
import type { Page } from 'src/schemas/PageSchema';
import { logDebug } from 'src/utils/logHelpers';

export interface ImportedPage extends Partial<Page> {
  fileName: string;
  action: 'create' | 'overwrite';
  existingPageKey?: string;
}

export const importedPages = atom<ImportedPage[]>([]);
export const isImporting = atom<boolean>(false);

export const importStore = {
  addPages: (
    pages: Array<Partial<Page> & { fileName: string }>,
    existingPages?: string[],
  ) => {
    logDebug('importStore', 'Adding pages:', pages.length);
    const newPages: ImportedPage[] = pages.map((page) => {
      // Check if this page exists by comparing names (case-insensitive)
      const pageName = page.name?.toLowerCase();
      const exists = existingPages?.some(
        (existingName) => existingName.toLowerCase() === pageName,
      );

      return {
        ...page,
        action: exists ? ('overwrite' as const) : ('create' as const),
        fileName: page.fileName,
      };
    });
    importedPages.set([...importedPages.get(), ...newPages]);
  },

  removePages: (indices: number[]) => {
    const current = importedPages.get();
    const filtered = current.filter((_, index) => !indices.includes(index));
    importedPages.set(filtered);
  },

  clear: () => {
    importedPages.set([]);
  },

  getPages: () => importedPages.get(),
  setImporting: (importing: boolean) => isImporting.set(importing),
};
