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

<div class="content-prose">
  <article class="surface">
    <h2>{t('site:clocks.title')}</h2>
    <ul class="clocks-list">
      {#each $clocks as clock (clock.key)}
        <li>
          <StoryClock {clock} />
        </li>
      {/each}
    </ul>
    {#if empty}
      <p>{t('site:clocks.empty')}</p>
    {/if}
  </article>
</div>

<style>
  /*
   * .surface publishes padding and containment only, so this box states
   * the interval between its own child blocks.
   */
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }

  .clocks-list {
    display: grid;
    row-gap: var(--cn-line);
    list-style: none;
    padding: 0;
    margin: 0;
  }
</style>