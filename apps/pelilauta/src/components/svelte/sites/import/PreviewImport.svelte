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
<section class="column-l surface p-2">
  <h2>Import Preview</h2>
  <p class="text-low">Review the files to be imported. Pages with matching names will automatically overwrite existing content. Remove any files you don't want to import.</p>
  
  <div class="toolbar mb-2">
    <span class="text-small text-low">{pages.length} file{pages.length === 1 ? '' : 's'} ready</span>
    <button class="button outlined small" onclick={clearAll}>Clear All</button>
  </div>
  
  <div class="flex flex-col">
    {#each pages as page, index}
      {@const exists = pageExists(page.name || '')}
      <article class="surface border p-2">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h4 class="mb-1">
              {page.name || page.fileName}
              {#if page.category}
                <span class="badge text-small ml-1">{page.category}</span>
              {/if}
            </h4>
            <p class="text-small text-low mb-1">
              Source: <code>{page.fileName}</code>
            </p>
            {#if page.markdownContent}
              <p class="text-small text-low">
                Content preview: {page.markdownContent.slice(0, 100)}{page.markdownContent.length > 100 ? '...' : ''}
              </p>
            {/if}
            
            {#if exists}
              <div class="flex items-center gap-2 mt-2">
                {#if page.action === 'overwrite'}
                  <span class="text-warning text-small">⚠️ Will overwrite existing page</span>
                {:else}
                  <span class="text-info text-small">ℹ️ Will create new page (with auto-generated name)</span>
                {/if}
              </div>
            {:else}
              <p class="text-success text-small mt-2">✅ Will create new page</p>
            {/if}
          </div>
          
          <button 
            class="button outlined small"
            onclick={() => removeFile(index)}
          >
            Remove
          </button>
        </div>
      </article>
    {/each}
  </div>
  
  <div class="toolbar mt-4">
    <button 
      class="button primary" 
      onclick={importPages}
      disabled={!canImport}
    >
      {#if importing}
        Importing...
      {:else}
        Import {pages.length} Page{pages.length === 1 ? '' : 's'}
      {/if}
    </button>
    <button class="button outlined" onclick={clearAll} disabled={importing}>
      Cancel
    </button>
  </div>
</section>
{/if}
