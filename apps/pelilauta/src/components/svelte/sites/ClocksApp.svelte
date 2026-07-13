<script lang="ts">
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import { site } from '../../../stores/site';
import { clocks, loading } from '../../../stores/site/clocksStore';
import StoryClock from './Clock.svelte';

interface Props {
  site: Site;
}
const { site: initialSite }: Props = $props();
$site = initialSite;
const empty = $derived.by(() => {
  return !$loading && $clocks.length === 0;
});
</script>

<div class="content-columns">
  <article class="column-l">
    <h2>{t('site:clocks.title')}</h2>
    <ul>
      {#each $clocks as clock, i}
        <StoryClock {clock} />
      {/each}
    </ul>
    {#if empty}
      <p>{t('site:clocks.empty')}</p>
    {/if}
  </article>
</div>