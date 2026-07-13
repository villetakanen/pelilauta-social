<script lang="ts">
import { type CnListItem, CnSortableList } from '@11thdeg/cyan-lit';
import { updateSiteApi } from 'src/firebase/client/site/updateSiteApi';
import {
  type CategoryRef,
  parseCategories,
  type Site,
} from 'src/schemas/SiteSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logDebug, logError } from 'src/utils/logHelpers';
import { onMount } from 'svelte';
import SvelteSortableList from '../../app/SvelteSortableList.svelte';

interface Props {
  site: Site;
}
const { site }: Props = $props();

let categories: Array<CategoryRef> = $state(
  site.pageCategories ? [...site.pageCategories] : [],
);
let saving = $state(false);
let hasChanges = $state(false);
let newCategory = $state('');

// Convert categories to list items for the UI component
const categoryItems = $derived.by(() =>
  categories.map((cat) => ({
    key: cat.slug,
    title: cat.name,
  })),
);

onMount(() => {
  const el = document.getElementById('sortable-page-category-list');
  // Initialize the sortable list
  if (el instanceof CnSortableList) {
    el.addEventListener('items-changed', (event) => {
      reorderCategories(
        (event as CustomEvent<{ items: CnListItem[] }>).detail.items,
      );
    });
  }
});

/**
 * Adds a new category from a (non submititting) button
 */
function addCategory(e: Event) {
  e.preventDefault();
  const value = newCategory.trim();
  if (value) {
    categories.push({
      name: value,
      slug: value.toLowerCase().replace(/\s+/g, '-'),
    });
    newCategory = '';
    hasChanges = true;
  }
}

/**
 * Updates category order based on drag-and-drop reordering
 */
function reorderCategories(newOrder: Array<CnListItem>) {
  hasChanges = true;
  categories = newOrder.map((item) => ({
    name: item.title,
    slug: item.key,
  }));
  logDebug('Reordered categories', categories);
}

/**
 * Reset to original categories
 */
function reset() {
  hasChanges = false;
  categories = site.pageCategories ? [...site.pageCategories] : [];
}

/**
 * Save categories to database
 */
async function onsubmit(e: Event) {
  e.preventDefault();
  if (!hasChanges) return;
  saving = true;
  try {
    // Check if categories are valid
    const cats = parseCategories(categories);
    // Silent update to site
    await updateSiteApi(
      {
        key: site.key,
        pageCategories: cats,
      },
      true,
    );
  } catch (error) {
    logError('SiteCategoriesTool', 'Error saving categories:', error);
    pushSnack(t('site:toc.admin.errorSaving'));
  } finally {
    saving = false;
  }
}
</script>

<section>
  <h3>{t("site:toc.admin.categories.title")}</h3>
  <form {onsubmit}>
    {#if categories.length > 0}
      <SvelteSortableList
        items={categoryItems}
        onItemsChanged={(e) => {
          reorderCategories(e);
        }}
        delete={true}
      />
    {:else}
      <p class="info-text">{t("site:toc.admin.noCategories")}</p>
    {/if}

    <div class="toolbar border border-radius">
      <cn-icon noun="add"></cn-icon>
      <input
        class="grow"
        type="text"
        id="newCategory"
        name="newCategory"
        bind:value={newCategory}
        placeholder={t("site:toc.admin.categoryPlaceholder")}
      />

      <button
        class="no-shrink"
        disabled={!newCategory}
        type="button"
        onclick={addCategory}
      >
        {t("actions:add")}
      </button>
    </div>

    <div class="toolbar">
      <button
        type="button"
        class="text"
        onclick={reset}
        disabled={!hasChanges || saving}
      >
        {t("actions:reset")}
      </button>
      <button type="submit" disabled={!hasChanges || saving}>
        {#if saving}
          <span class="spinner small"></span>
        {/if}
        {t("actions:save")}
      </button>
    </div>
  </form>
</section>
