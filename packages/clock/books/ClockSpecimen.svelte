<script lang="ts">
/**
 * ClockSpecimen — CnClock's example rail: the canonical interactive dial,
 * then one row per axis the Definition of Done in `specs/clock/spec.md` names.
 * Each row prints the announced step text beneath its dial, because the
 * label CnClock carries is aria-only and never drawn into the SVG itself.
 *
 * Book: apps/design/src/content/extensions/clock.mdx
 */
import CnClock from '../CnClock.svelte';
import type { Ticks } from '../geometry';

interface Props {
  group: 'canonical' | 'sizes' | 'weighted' | 'labels' | 'stages' | 'modes';
}

const { group }: Props = $props();

let canonicalValue = $state(2);
let modesValue = $state(3);

interface Dial {
  label: string;
  ticks?: Ticks;
  value: number;
  view?: boolean;
  caption: string;
}

const SIZES: Dial[] = [
  {
    label: 'Four-slice clock',
    ticks: 4,
    value: 2,
    view: true,
    caption: '4 ticks, 2/4',
  },
  {
    label: 'Six-slice clock',
    ticks: 6,
    value: 3,
    view: true,
    caption: '6 ticks, 3/6',
  },
  {
    label: 'Eight-slice clock',
    ticks: 8,
    value: 5,
    view: true,
    caption: '8 ticks, 5/8',
  },
];

const WEIGHTED: Dial[] = [
  {
    label: 'Weighted clock',
    ticks: [1, 2, 1],
    value: 2,
    view: true,
    caption: 'weights [1, 2, 1]',
  },
];

const LABELS: Dial[] = [
  {
    label: 'Faction goal',
    ticks: [{ label: 'Spotted' }, { label: 'Alarmed' }, { label: 'Mobilised' }],
    value: 1,
    view: true,
    caption: '"Spotted"',
  },
];

const STAGES: Dial[] = [
  {
    label: 'Empty clock',
    ticks: 4,
    value: 0,
    view: true,
    caption: 'empty, 0/4',
  },
  {
    label: 'Partial clock',
    ticks: 4,
    value: 2,
    view: true,
    caption: 'partial, 2/4',
  },
  { label: 'Full clock', ticks: 4, value: 4, view: true, caption: 'full, 4/4' },
];

const ROWS: Record<Exclude<Props['group'], 'canonical' | 'modes'>, Dial[]> = {
  sizes: SIZES,
  weighted: WEIGHTED,
  labels: LABELS,
  stages: STAGES,
};
</script>

{#if group === 'canonical'}
  <div class="clock-specimen">
    <CnClock label="Alarm" bind:value={canonicalValue} />
    <p class="clock-specimen__caption text-label">{canonicalValue}/4</p>
  </div>
{:else if group === 'modes'}
  <div class="clock-specimen__row">
    <div class="clock-specimen">
      <CnClock label="Interactive clock" ticks={6} bind:value={modesValue} />
      <p class="clock-specimen__caption text-label">interactive — click, tap, or use the arrow keys</p>
    </div>
    <div class="clock-specimen">
      <CnClock label="View-only clock" ticks={6} value={3} view />
      <p class="clock-specimen__caption text-label">view-only</p>
    </div>
    <div class="clock-specimen">
      <CnClock label="Disabled clock" ticks={6} value={3} disabled />
      <p class="clock-specimen__caption text-label">disabled</p>
    </div>
  </div>
{:else}
  <div class="clock-specimen__row">
    {#each ROWS[group] as dial (dial.caption)}
      <div class="clock-specimen">
        <CnClock label={dial.label} ticks={dial.ticks} value={dial.value} view={dial.view} />
        <p class="clock-specimen__caption text-label">{dial.caption}</p>
      </div>
    {/each}
  </div>
{/if}

<style>
  .clock-specimen__row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--cn-gap);
  }

  .clock-specimen {
    display: grid;
    justify-items: center;
    row-gap: var(--cn-grid);
  }

  .clock-specimen__caption {
    color: var(--cn-color-text-low);
  }
</style>
