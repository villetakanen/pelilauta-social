<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import type {
  CnListItem,
  CnSortableListAnnouncements,
} from '@design-system/components/CnSortableList.svelte';
import CnSortableList from '@design-system/components/CnSortableList.svelte';
import { updateSiteApi } from 'src/firebase/client/site/updateSiteApi';
import {
  type CategoryRef,
  parseCategories,
  type Site,
} from 'src/schemas/SiteSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logDebug, logError } from 'src/utils/logHelpers';

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

// Map categories to list items for the sortable list, with each item defining a delete action.
const categoryItems = $derived(
  categories.map((cat) => ({
    key: cat.slug,
    title: cat.name,
    actions: rowActions,
  })),
);

/**
 * Adds a new category.
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
 * Updates category order from sortable list events.
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
 * Removes one category while preserving the remaining order.
 */
function deleteCategory(slug: string) {
  hasChanges = true;
  categories = categories.filter((cat) => cat.slug !== slug);
}

/**
 * Resets categories to initial values.
 */
function reset() {
  hasChanges = false;
  categories = site.pageCategories ? [...site.pageCategories] : [];
}

/**
 * Persists categories to the database.
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

const announcements: CnSortableListAnnouncements = {
  pickup: (title, position, length) =>
    t('site:toc.admin.categories.announcements.pickup', {
      title,
      position,
      length,
    }),
  position: (title, position, length) =>
    t('site:toc.admin.categories.announcements.position', {
      title,
      position,
      length,
    }),
  completion: (title, position, length) =>
    t('site:toc.admin.categories.announcements.completion', {
      title,
      position,
      length,
    }),
  cancellation: (title, position, length) =>
    t('site:toc.admin.categories.announcements.cancellation', {
      title,
      position,
      length,
    }),
};
</script>

{#snippet rowActions(item: CnListItem)}
  <button
    type="button"
    class="text"
    aria-label={t("site:toc.admin.categories.delete", { title: item.title })}
    onclick={() => deleteCategory(item.key)}
  >
    <CnIcon noun="delete" decorative />
  </button>
{/snippet}

<section class="surface">
  <h3>{t("site:toc.admin.categories.title")}</h3>
  <form {onsubmit}>
    {#if categories.length > 0}
      <CnSortableList
        items={categoryItems}
        onitemschange={reorderCategories}
        {announcements}
        label={t("site:toc.admin.categories.label")}
      />
    {:else}
      <p class="info-text">{t("site:toc.admin.noCategories")}</p>
    {/if}

    <div class="add-row">
      <input
        type="text"
        id="newCategory"
        name="newCategory"
        bind:value={newCategory}
        placeholder={t("site:toc.admin.categoryPlaceholder")}
      />

      <button
        disabled={!newCategory}
        type="button"
        onclick={addCategory}
      >
        <CnIcon noun="add" />
        {t("actions:add")}
      </button>
    </div>

    <div class="text-end">
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
          <CnLoader inline />
        {/if}
        {t("actions:save")}
      </button>
    </div>
  </form>
</section>

<style>
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }

  form {
    display: grid;
    row-gap: var(--cn-line);
  }

  .add-row {
    display: flex;
    gap: var(--cn-gap);
    align-items: center;
  }

  .add-row input {
    flex: 1 1 auto;
    min-inline-size: 0;
  }
</style>
