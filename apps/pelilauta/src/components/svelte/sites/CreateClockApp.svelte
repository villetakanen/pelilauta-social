<script lang="ts">
import CnClock from '@clock/CnClock.svelte';
import CnIcon from '@design-system/components/CnIcon.svelte';
import { addClocktoSite } from 'src/firebase/client/site/addClockToSite';
import { parseClock } from 'src/schemas/ClockSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import { uid } from '../../../stores/session';

interface Props {
  site: Site;
}
const { site }: Props = $props();

async function handleSubmit(event: Event) {
  event.preventDefault();

  try {
    const c = { ...clock };
    await addClocktoSite(site.key, { ...clock });
    window.location.href = `/sites/${site.key}/clocks`;
  } catch (error) {
    logError(error);
  }
}
function addTick() {
  clock.ticks.push(1);
}
function increaseTick(i: number) {
  clock.ticks[i] += 1;
}
function decreaseTick(i: number) {
  if (clock.ticks[i] > 1) clock.ticks[i] -= 1;
}
const clock = $state(
  parseClock({
    ticks: [1, 1],
    owners: [$uid],
    label: t('site:clocks.create.default'),
  }),
);
</script>

<section class="surface">
  <div class="clock-preview">
    <CnClock label={clock.label} ticks={clock.ticks} value={0} view />
    <p>{clock.label}</p>
  </div>

  <form onsubmit={handleSubmit}>
    <label>
      {t('entries:clock.label')}
      <input
        type="text"
        bind:value={clock.label}
        placeholder={t('site:clocks.create.label')}
      />
    </label>
    <h4>{t('entries:clock.ticks')}</h4>

    <div class="tick-grid">
      <span>{t('entries:clock.tickIndex')}</span>
      <span>{t('entries:clock.tickSize')}</span>
      <span>
        <CnIcon noun="add" size="small" />
      </span>
      <span>
        <CnIcon noun="reduce" size="small" />
      </span>
      <span>
        <CnIcon noun="delete" size="small" />
      </span>

      {#each clock.ticks as tick, i}
        <span>{i + 1}</span>
        <span>{tick}</span>
        <button
          type="button"
          class="text"
          onclick={() => increaseTick(i)}
          aria-label={t('actions:increase.tick')}
        >
          <CnIcon noun="add" size="small" />
        </button>
        <button
          type="button"
          class="text"
          onclick={() => decreaseTick(i)}
          aria-label={t('actions:decrease.tick')}
        >
          <CnIcon noun="reduce" size="small" />
        </button>
        <button
          type="button"
          class="text"
          onclick={() => clock.ticks.splice(i, 1)}
          aria-label={t('actions:delete.tick')}
        >
          <CnIcon noun="delete" size="small" />
        </button>
      {/each}
    </div>

    <hr />
    <div class="text-end">
      <button onclick={addTick} class="text" type="button">
        <CnIcon noun="add" size="small" />
        <span>{t('actions:create.tick')}</span>
      </button>
    </div>

    <div class="text-end">
      <button type="submit">
        <CnIcon noun="clock" />
        <span>{t('actions:save')}</span>
      </button>
    </div>
  </form>
</section>

<style>
  .surface,
  form {
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

  .tick-grid {
    display: grid;
    grid-template-columns: 1fr 1fr repeat(3, auto);
    gap: var(--cn-grid);
    align-items: center;
  }

  .tick-grid > :nth-child(5n + 3),
  .tick-grid > :nth-child(5n + 4),
  .tick-grid > :nth-child(5n + 5) {
    justify-self: center;
  }
</style>