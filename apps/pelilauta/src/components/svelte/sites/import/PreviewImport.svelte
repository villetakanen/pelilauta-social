<script lang="ts">
import { updateSiteApi } from 'src/firebase/client/site/updateSiteApi';
import type { PageRef } from 'src/schemas/SiteSchema';
import {
  type ImportedPage,
  importedPages,
  importStore,
  isImporting,
} from 'src/stores/site/importsStore';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logDebug, logError } from 'src/utils/logHelpers';
import { toMekanismiURI } from 'src/utils/mekanismiUtils';
import { uid } from '../../../../stores/session';
import { site } from '../../../../stores/site';

const pages = $derived($importedPages);
const currentSite = $derived($site);
const importing = $derived($isImporting);

function removeFile(index: number) {
  importStore.removePages([index]);
}

function clearAll() {
  importStore.clear();
}

// Check if a page with the same name already exists in the current site
function pageExists(pageName: string): boolean {
  if (!currentSite?.pageRefs) return false;
  return currentSite.pageRefs.some(
    (ref) => ref.name.toLowerCase() === pageName.toLowerCase(),
  );
}

// Get existing page key for overwrite actions
function getExistingPageKey(pageName: string): string | undefined {
  if (!currentSite?.pageRefs) return undefined;
  const existingRef = currentSite.pageRefs.find(
    (ref) => ref.name.toLowerCase() === pageName.toLowerCase(),
  );
  return existingRef?.key;
}

// Helper to remove undefined values from objects (Firebase doesn't accept undefined)
function removeUndefinedValues<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

// The index entry a written page contributes. flowTime carries the date from
// the file, so the index orders imported pages by when they were written.
function toPageRef(importedPage: ImportedPage, key: string): PageRef {
  return {
    key,
    name: importedPage.name || importedPage.fileName,
    author: $uid || '-',
    category: importedPage.category || '-',
    flowTime: importedPage.flowTime ?? Date.now(),
  };
}

async function importPages() {
  if (!currentSite || !$uid) {
    pushSnack(t('site:import.snacks.noSession'));
    return;
  }

  importStore.setImporting(true);

  try {
    let successCount = 0;
    let errorCount = 0;

    // The site's page index is written once for the whole batch. Writing it per
    // page means a read and a write of the site document for every file, which
    // is what makes a large import slow.
    const importedRefs: PageRef[] = [];

    for (const importedPage of pages) {
      try {
        const pageKey =
          importedPage.action === 'overwrite'
            ? getExistingPageKey(importedPage.name || '')
            : currentSite.usePlainTextURLs
              ? toMekanismiURI(importedPage.name || '')
              : undefined;

        if (importedPage.action === 'overwrite' && !pageKey) {
          logError(
            'PreviewImport',
            'Cannot find existing page for overwrite:',
            importedPage.name,
          );
          errorCount++;
          continue;
        }

        if (importedPage.action === 'create') {
          // Create new page
          const { addPage } = await import('src/firebase/client/page/addPage');

          const pageData = removeUndefinedValues({
            name: importedPage.name || importedPage.fileName,
            markdownContent: importedPage.markdownContent,
            category: importedPage.category,
            siteKey: currentSite.key,
            owners: [$uid],
            // A file carrying dates keeps them; a file without them is
            // stamped with the time of the import.
            createdAt: importedPage.createdAt,
            updatedAt: importedPage.updatedAt,
            flowTime: importedPage.flowTime,
          });

          const createdKey = await addPage(currentSite.key, pageData, pageKey, {
            updateIndex: false,
          });
          importedRefs.push(toPageRef(importedPage, createdKey));

          logDebug('PreviewImport', 'Created page:', importedPage.name);
        } else {
          // Update existing page
          const { updatePage } = await import(
            'src/firebase/client/page/updatePage'
          );

          if (!pageKey) {
            errorCount++;
            continue;
          }

          const updateData = removeUndefinedValues({
            name: importedPage.name || importedPage.fileName,
            markdownContent: importedPage.markdownContent,
            category: importedPage.category,
            updatedAt: importedPage.updatedAt,
            flowTime: importedPage.flowTime,
          });

          await updatePage(currentSite.key, pageKey, updateData, {
            updateIndex: false,
          });
          importedRefs.push(toPageRef(importedPage, pageKey));

          logDebug('PreviewImport', 'Updated page:', importedPage.name);
        }

        successCount++;
      } catch (error) {
        logError(
          'PreviewImport',
          'Error importing page:',
          importedPage.name,
          error,
        );
        errorCount++;
      }
    }

    if (importedRefs.length > 0) {
      const pageRefs = currentSite.pageRefs ? [...currentSite.pageRefs] : [];
      for (const ref of importedRefs) {
        const index = pageRefs.findIndex(
          (existing) => existing.key === ref.key,
        );
        if (index === -1) {
          pageRefs.push(ref);
        } else {
          pageRefs[index] = ref;
        }
      }
      await updateSiteApi({ key: currentSite.key, pageRefs });
    }

    if (successCount > 0) {
      pushSnack(
        `Successfully imported ${successCount} page${successCount === 1 ? '' : 's'}`,
      );
    }
    if (errorCount > 0) {
      pushSnack(
        `Failed to import ${errorCount} page${errorCount === 1 ? '' : 's'}`,
      );
    }

    if (successCount > 0) {
      // Clear the import store on success
      importStore.clear();
      // Optionally redirect or refresh
      setTimeout(() => {
        window.location.href = `/sites/${currentSite.key}`;
      }, 2000);
    }
  } catch (error) {
    logError('PreviewImport', 'Error during import:', error);
    pushSnack(t('site:import.snacks.failed'));
  } finally {
    importStore.setImporting(false);
  }
}

const hasPages = $derived(pages.length > 0);
const canImport = $derived(hasPages && !importing && currentSite && $uid);
</script>

{#if hasPages}
<section class="surface">
  <h2>{t('site:import.preview.title')}</h2>
  <p>{t('site:import.preview.info')}</p>
  
  <div class="preview-toolbar">
    <p>{t('site:import.preview.ready', { count: pages.length })}</p>
    <button class="text" onclick={clearAll} type="button">{t('site:import.preview.clearAll')}</button>
  </div>
  
  <div class="preview-list">
    {#each pages as page, index}
      {@const exists = pageExists(page.name || '')}
      <article class="surface elevation-1">
        <div class="preview-item-header">
          <h4>
            {page.name || page.fileName}
            {#if page.category}
              <span class="chip">{page.category}</span>
            {/if}
          </h4>
          <button 
            class="text"
            onclick={() => removeFile(index)}
            type="button"
          >
            {t('site:import.preview.remove')}
          </button>
        </div>
        <p>
          {t('site:import.preview.source')}: <code>{page.fileName}</code>
        </p>
        {#if page.markdownContent}
          <p>
            {t('site:import.preview.contentPreview')}: {page.markdownContent.slice(0, 100)}{page.markdownContent.length > 100 ? '...' : ''}
          </p>
        {/if}
        
        {#if exists}
          <div>
            {#if page.action === 'overwrite'}
              <p>⚠️ {t('site:import.preview.willOverwrite')}</p>
            {:else}
              <p>ℹ️ {t('site:import.preview.willCreateRenamed')}</p>
            {/if}
          </div>
        {:else}
          <p>✅ {t('site:import.preview.willCreate')}</p>
        {/if}
      </article>
    {/each}
  </div>
  
  <div class="text-end">
    <button class="text" onclick={clearAll} disabled={importing} type="button">
      {t('site:import.preview.cancel')}
    </button>
    <button 
      onclick={importPages}
      disabled={!canImport}
      type="button"
    >
      {#if importing}
        {t('site:import.preview.importing')}
      {:else}
        {t('site:import.preview.importAction', { count: pages.length })}
      {/if}
    </button>
  </div>
</section>
{/if}

<style>
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }

  .preview-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--cn-gap);
  }

  .preview-list {
    display: grid;
    row-gap: var(--cn-line);
  }

  .preview-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--cn-gap);
  }
</style>
