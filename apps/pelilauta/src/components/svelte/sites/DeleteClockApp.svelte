<script lang="ts">
import CnClock from '@clock/CnClock.svelte';
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
  <section class="surface">
    <div class="clock-preview">
      <CnClock
        label={clock?.label || ''}
        ticks={clock?.ticks}
        value={clock?.stage}
        view
      />
      <p>{clock?.label}</p>
    </div>
    <p>{t('site:deteteClock.info', { name: `${clock?.label}`})}</p>
    <form onsubmit={handleSubmit} class="text-end">
      <button
        type="button"
        class="text"
        onclick={() => window.history.back()}
      >
        {t('actions:cancel')}
      </button>
      <button type="submit">{t('actions:delete')}</button>
    </form>
  </section>
</WithAuth>

<style>
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }

  /*
   * @todo The design system provides no listing row component.
   * Tracked in plans/debt/the-design-system-has-no-listing-row.md.
   */
  .clock-preview {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }

  .clock-preview p {
    flex: 1 1 auto;
    min-inline-size: 0;
  }
</style>


