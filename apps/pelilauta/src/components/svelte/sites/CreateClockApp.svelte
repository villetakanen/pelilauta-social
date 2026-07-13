<script lang="ts">
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

/**
 * A Simple form to create a new clock
 *
 * Clock labels are unique per site, so we'll need to mekanismiURI the label
 * and then check if it's unique before submitting the form
 */

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

<div class="content-columns">
  <section class="border border-radius p-2 column-s">
    <h4>{t('site:clocks.create.preview')}</h4>
    <div class="flex align-center flex-no-wrap">
      <cn-story-clock name={clock.label} value="0">
        {#each clock.ticks as tick}
          <cn-tick size={tick}></cn-tick>
        {/each}
      </cn-story-clock>
      <p>{clock.label}</p>
    </div>
  </section>

  <form onsubmit={handleSubmit}>
    <label>
      {t('entries:clock.label')}
      <input
        type="text" bind:value={clock.label}
        placeholder={t('site:clocks.create.label')} 
      />
    </label>
    <h4>{t('entries:clock.ticks')}</h4>

    <div class="grid tick-grid">
      <span>{t('entries:clock.tickIndex')}</span>
      <span>{t('entries:clock.tickSize')}</span>
      <span>
        <cn-icon noun="add" small></cn-icon>
      </span>
      <span>
        <cn-icon noun="reduce" small></cn-icon>
      </span>
      <span>
        <cn-icon noun="delete" small></cn-icon>
      </span>
    
    {#each clock.ticks as tick, i}
      <span>{i + 1}</span>
      <span>{tick}</span>
        <button type="button" class="text" onclick={() => increaseTick(i)}
            aria-label={t('actions:increase.tick')}>
          <cn-icon noun="add" small></cn-icon>
        </button>
        <button type="button" class="text" onclick={() => decreaseTick(i)}
            aria-label={t('actions:decrease.tick')}>
          <cn-icon noun="reduce" small></cn-icon>
        </button>
        <button type="button" class="text" onclick={() => clock.ticks.splice(i, 1)}
            aria-label={t('actions:delete.tick')}>
          <cn-icon noun="delete" small></cn-icon>
        </button>
    {/each}
    </div>

    <hr>
    <div class="toolbar justify-end">
    <button onclick={addTick} class="text" type="button">
        <cn-icon noun="add" small></cn-icon>
        <span>{t('actions:create.tick')}</span>
    </button>
  </div>


  <div class="toolbar">
  <button type="submit">
    <cn-icon noun="clock"></cn-icon>
    <span>{t('actions:save')}</span></button>
    </div>
  </form>
</div>

<style>
.tick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr calc(var(--cn-icon-size) + 4px) calc(var(--cn-icon-size) + 4px) calc(var(--cn-icon-size) + 4px);
  gap: 0.5rem;
}
.tick-grid span:nth-child(3),
.tick-grid span:nth-child(4),
.tick-grid span:nth-child(5) {
  justify-self: center;
}
</style>