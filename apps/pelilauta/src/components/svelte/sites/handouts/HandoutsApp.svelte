<script lang="ts">
import { t } from 'src/utils/i18n';
import { site } from '../../../../stores/site';
import HandoutList from './HandoutList.svelte';

/**
 * Handouts application for site members.
 * Site access is verified at the server-side before this component is rendered.
 */

// Site is derived directly from the store, which is initialized by SiteStoreInitializer
const currentSite = $derived.by(() => $site);
</script>

<div class="content-columns">
  {#if currentSite}
    <article class="column-l surface">
      <h2>{t('site:handouts.title')}</h2>
      <p class="text-light">{t('site:handouts.description')}</p>

      <HandoutList />
    </article>
  {:else}
    <div class="column-l p-4">
      <p class="text-light">{t('common:loading')}</p>
    </div>
  {/if}
</div>
