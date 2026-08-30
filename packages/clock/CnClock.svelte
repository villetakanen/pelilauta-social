<script lang="ts">
/**
 * CnClock — a segmented circular dial for tracking a countdown, an obstacle
 * or a faction goal during play. `specs/clock/spec.md` governs it.
 *
 * The geometry — normalising `ticks`, clamping `value`, resolving the step
 * text, building each slice's path — lives in `geometry.ts`, pure and
 * DOM-free. This host owns the three presentations the spec names (view,
 * interactive, disabled) and the input bindings interactive mode takes:
 * pointer click, shift-click, long-press, and the keyboard.
 *
 * `view` takes precedence over `disabled` — a viewer who cannot edit a clock
 * does not need to know it would otherwise be locked.
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
  /** The dial's accessible name. Required, and localised by the consumer. */
  label: string;
  /** Slice count, relative weights, or descriptors. Defaults to 4 equal slices. */
  ticks?: Ticks;
  /** Completed slices, out of the total. Bindable. */
  value?: number;
  /** Presentation mode: a static picture rather than a control. */
  view?: boolean;
  /** Renders an inert slider rather than a picture; `view` wins over this. */
  disabled?: boolean;
  /** Renders a hidden input, for a form that reads the value from FormData. */
  name?: string;
  /** Runs on every value change, interactive mode only. */
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

// The viewBox matches the host box in px (12 grid units), so an SVG user unit
// is a device pixel and `stroke-width` lands at the width the stylesheet asks
// for. The radius leaves the stroke's outer half room rather than clipping it.
const RADIUS = 46;
const CENTER = 48;

const slices = $derived(normalizeTicks(ticks));
const totalSlices = $derived(slices.length);
const resolvedValue = $derived(clampValue(value, totalSlices));
const stepText = $derived(resolveStepText(resolvedValue, slices));
const paths = $derived(buildSlicePaths(slices, RADIUS, CENTER));

// `view` takes precedence: a viewer sees a picture even where `disabled` is
// also set, so the two flags are never both live at once.
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
  // A long press already applied its decrement; the click that follows the
  // pointer's release must not also apply the plain-click increment.
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
