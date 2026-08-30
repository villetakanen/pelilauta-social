<script lang="ts">
import CnClock from '@clock/CnClock.svelte';
import CnIcon from '@design-system/components/CnIcon.svelte';
import type { Clock } from 'src/schemas/ClockSchema';
import { uid } from '../../../stores/session';
import { site } from '../../../stores/site';
import { updateClock } from '../../../stores/site/clocksStore';

interface Props {
  clock: Clock;
}
const { clock }: Props = $props();

const view = $derived.by(() => !$site?.owners.includes($uid));

async function handleChange({ value }: { value: number }) {
  await updateClock({ ...clock, stage: value });
}
</script>

<div class="clock-row">
  <CnClock
    label={clock.label}
    ticks={clock.ticks}
    value={clock.stage}
    {view}
    onchange={handleChange}
  />
  <div class="clock-info">
    <p>{clock.label}</p>
    {#if !view}
      <code>clock:{clock.key}</code>
    {/if}
  </div>
  {#if !view}
    <a href={`/sites/${$site?.key}/delete/clock/${clock.key}`} aria-label="delete clock" class="button text">
      <CnIcon noun="delete" />
    </a>
  {/if}
</div>

<style>
  /*
   * @todo No design-system capability publishes a listing row — an icon or clock
   * beside a label and controls — so this row states its own flex rule locally.
   * Anchored at plans/debt/the-design-system-has-no-listing-row.md.
   */
  .clock-row {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }

  .clock-info {
    flex: 1 1 auto;
    min-inline-size: 0;
  }
</style>