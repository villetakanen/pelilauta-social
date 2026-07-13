<script lang="ts">
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
    <nav class="toolbar">
      <h1 class="grow">{t("library:sites.title")}</h1>
      <button class="text" aria-label={directionNoun} onclick={toggleOrder}>
        <cn-icon noun={directionNoun}></cn-icon>
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

  <FilteredSites />

  <footer>
    <p>{t("library:sites.count", { count: $userSites.length })}</p>
  </footer>
</div>
