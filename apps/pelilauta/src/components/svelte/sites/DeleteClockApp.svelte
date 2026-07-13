<script lang="ts">
import { deleteClock } from 'src/firebase/client/site/deleteClock';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSessionSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
import { site } from '../../../stores/site';
import { clocks } from '../../../stores/site/clocksStore';
import WithAuth from '../app/WithAuth.svelte';

interface Props {
  site: Site;
  key: string;
}
const { site: originalSite, key }: Props = $props();
$site = originalSite;

const allow = $derived.by(() => $site?.owners.includes($uid));
const clock = $derived.by(() => $clocks.find((clock) => clock.key === key));

async function handleSubmit(event: Event) {
  event.preventDefault();
  $site?.key && (await deleteClock($site?.key, key));
  pushSessionSnack(t('site:deteteClock.success', { name: `${clock?.label}` }));
  window.history.back();
}
</script>

<WithAuth {allow}>
  <div class="content-columns">
    <div>
      <h1 class="downscaled">{t('actions:confirm.delete')}</h1>
      <div class="border border-radius flex align-center p-1">
        <cn-story-clock 
          view
          name={clock?.label} 
          value={clock?.stage} 
        >
          {#each clock?.ticks || [] as tick}
            <cn-tick size={tick}></cn-tick>
          {/each}
        </cn-story-clock>
        <p class="grow">{clock?.label}</p>
      </div>
      <p>{t('site:deteteClock.info', { name: `${clock?.label}`})}</p>
      <form onsubmit={handleSubmit}>
        <div class="toolbar justify-end">
          <button
            type="button"
            class="text"
            onclick={() => window.history.back()}
          >
            {t('actions:cancel')}
          </button>
          <button type="submit">{t('actions:delete')}</button>
        </div>
      </form>
    </div>
  </div>
</WithAuth>

