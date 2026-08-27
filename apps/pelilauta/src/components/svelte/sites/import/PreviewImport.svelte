<script lang="ts">
import {
  importedPages,
  importStore,
  isImporting,
} from 'src/stores/site/importsStore';
import { pushSnack } from 'src/utils/client/snackUtils';
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

async function importPages() {
  if (!currentSite || !$uid) {
    pushSnack('Error: No site or user authenticated');
    return;
  }

  importStore.setImporting(true);

  try {
    let successCount = 0;
    let errorCount = 0;

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
          });

          await addPage(currentSite.key, pageData, pageKey);

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
          });

          await updatePage(currentSite.key, pageKey, updateData);

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
    pushSnack('Import failed');
  } finally {
    importStore.setImporting(false);
  }
}

const hasPages = $derived(pages.length > 0);
const canImport = $derived(hasPages && !importing && currentSite && $uid);
</script>

{#if hasPages}
<section class="surface">
  <h2>Import Preview</h2>
  <p>Review the files to be imported. Pages with matching names will automatically overwrite existing content. Remove any files you don't want to import.</p>
  
  <div class="preview-toolbar">
    <p>{pages.length} file{pages.length === 1 ? '' : 's'} ready</p>
    <button class="text" onclick={clearAll} type="button">Clear All</button>
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
            Remove
          </button>
        </div>
        <p>
          Source: <code>{page.fileName}</code>
        </p>
        {#if page.markdownContent}
          <p>
            Content preview: {page.markdownContent.slice(0, 100)}{page.markdownContent.length > 100 ? '...' : ''}
          </p>
        {/if}
        
        {#if exists}
          <div>
            {#if page.action === 'overwrite'}
              <p>⚠️ Will overwrite existing page</p>
            {:else}
              <p>ℹ️ Will create new page (with auto-generated name)</p>
            {/if}
          </div>
        {:else}
          <p>✅ Will create new page</p>
        {/if}
      </article>
    {/each}
  </div>
  
  <div class="text-end">
    <button class="text" onclick={clearAll} disabled={importing} type="button">
      Cancel
    </button>
    <button 
      onclick={importPages}
      disabled={!canImport}
      type="button"
    >
      {#if importing}
        Importing...
      {:else}
        Import {pages.length} Page{pages.length === 1 ? '' : 's'}
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
