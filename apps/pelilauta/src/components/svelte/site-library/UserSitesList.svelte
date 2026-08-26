<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { onMount } from 'svelte';
import { uid } from '../../../stores/session';
import { refreshSites, userSites } from '../../../stores/userSites/index.ts';
import { t } from '../../../utils/i18n.ts';
import FilteredSites from './FilteredSites.svelte';
import { filters, toggleOrder } from './filters.svelte.ts';

const directionNoun = $derived(
  filters.orderDirection === 'asc' ? 'arrow-up' : 'arrow-down',
);

onMount(() => {
  if ($uid) {
    refreshSites($uid);
  }
});
</script>

<div class="content-cards">
  <header>
    <h1>{t("library:sites.title")}</h1>
    <nav class="sort-controls">
      <button class="text" aria-label={directionNoun} onclick={toggleOrder}>
        <CnIcon noun={directionNoun} />
      </button>
      <button
        class={filters.orderBy === "name" ? "" : "text"}
        onclick={() => (filters.orderBy = "name")}
      >
        {t("entries:site.name")}
      </button>
      <button
        class={filters.orderBy === "flowTime" ? "" : "text"}
        onclick={() => (filters.orderBy = "flowTime")}
      >
        {t("entries:site.flowTime")}
      </button>
    </nav>
  </header>

  <div class="card-grid">
    <FilteredSites />
  </div>

  <footer>
    <p>{t("library:sites.count", { count: $userSites.length })}</p>
  </footer>
</div>

<style>
  /*
   * @todo No design-system capability publishes a card container layout,
   * so this view states its own layout rules locally.
   * Anchored at plans/debt/the-design-system-has-no-card-container-layout.md.
   */
  .content-cards {
    display: flex;
    flex-direction: column;
    gap: var(--cn-line);
    margin-block-end: var(--cn-line);
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--cn-gap);
  }

  .sort-controls {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(calc(var(--cn-grid) * 32), 1fr));
    gap: var(--cn-gap);
  }

  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--cn-gap);
    color: var(--cn-color-text-low);
  }
</style>
