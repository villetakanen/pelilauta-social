<script lang="ts">
/**
 * CnClock renders a segmented circular dial for tracking countdowns, obstacles
 * or faction goals. `specs/clock/spec.md` governs the component.
 */
import {
  buildSlicePaths,
  clampValue,
  normalizeTicks,
  resolveStepText,
  type Ticks,
  wrapValue,
} from './geometry';
import './styles/clock.css';

interface Props {
  /** Sets the dial's accessible label. */
  label: string;
  /** Sets slice count, relative weights, or descriptors. Defaults to 4 equal slices. */
  ticks?: Ticks;
  /** Number of completed slices. Bindable. */
  value?: number;
  /** Renders a static presentation dial rather than an interactive slider. */
  view?: boolean;
  /** Renders a disabled slider. `view` takes precedence. */
  disabled?: boolean;
  /** Renders a hidden input for FormData form submission. */
  name?: string;
  /** Fires when the value changes in interactive mode. */
  onchange?: (event: { value: number }) => void;
}

let {
  label,
  ticks,
  value = $bindable(0),
  view = false,
  disabled = false,
  name,
  onchange,
}: Props = $props();

const RADIUS = 46;
const CENTER = 48;

const slices = $derived(normalizeTicks(ticks));
const totalSlices = $derived(slices.length);
const resolvedValue = $derived(clampValue(value, totalSlices));
const stepText = $derived(resolveStepText(resolvedValue, slices));
const paths = $derived(buildSlicePaths(slices, RADIUS, CENTER));

const interactive = $derived(!view && !disabled);
const inert = $derived(!view && disabled);

let longPressTimer: ReturnType<typeof setTimeout> | undefined;
let longPressFired = false;
const LONG_PRESS_MS = 500;

function commit(next: number) {
  value = next;
  onchange?.({ value: next });
}

function step(delta: number) {
  if (!interactive) return;
  commit(wrapValue(resolvedValue, delta, totalSlices));
}

function setBoundary(next: number) {
  if (!interactive) return;
  commit(next);
}

function clearLongPress() {
  clearTimeout(longPressTimer);
  longPressTimer = undefined;
}

function handlePointerDown() {
  if (!interactive) return;
  longPressFired = false;
  longPressTimer = setTimeout(() => {
    longPressFired = true;
    step(-1);
  }, LONG_PRESS_MS);
}

function handleClick(event: MouseEvent) {
  if (!interactive) return;
  if (longPressFired) {
    longPressFired = false;
    return;
  }
  step(event.shiftKey ? -1 : 1);
}

function handleKeydown(event: KeyboardEvent) {
  if (!interactive) return;
  switch (event.key) {
    case 'ArrowUp':
    case 'ArrowRight':
    case ' ':
      event.preventDefault();
      step(1);
      break;
    case 'Enter':
      event.preventDefault();
      step(event.shiftKey ? -1 : 1);
      break;
    case 'ArrowDown':
    case 'ArrowLeft':
      event.preventDefault();
      step(-1);
      break;
    case 'Home':
      event.preventDefault();
      setBoundary(0);
      break;
    case 'End':
      event.preventDefault();
      setBoundary(totalSlices);
      break;
  }
}
</script>

{#if view}
  <div
    class="cn-clock"
    role="img"
    aria-label="{label}: {stepText}"
  >
    <svg viewBox="0 0 96 96" aria-hidden="true">
      {#each paths as path, index (index)}
        <path class="cn-clock-slice" data-completed={index < resolvedValue} d={path.d} />
      {/each}
    </svg>
  </div>
{:else}
  <div
    class="cn-clock"
    role="slider"
    tabindex="0"
    aria-label={label}
    aria-valuemin="0"
    aria-valuemax={totalSlices}
    aria-valuenow={resolvedValue}
    aria-valuetext={stepText}
    aria-disabled={inert ? 'true' : undefined}
    onpointerdown={handlePointerDown}
    onpointerup={clearLongPress}
    onpointerleave={clearLongPress}
    onpointercancel={clearLongPress}
    onclick={handleClick}
    onkeydown={handleKeydown}
  >
    <svg viewBox="0 0 96 96" aria-hidden="true">
      {#each paths as path, index (index)}
        <path class="cn-clock-slice" data-completed={index < resolvedValue} d={path.d} />
      {/each}
    </svg>
    {#if interactive && name}
      <input type="hidden" {name} value={resolvedValue} />
    {/if}
  </div>
{/if}
