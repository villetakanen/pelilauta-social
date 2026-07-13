<script lang="ts">
/**
 * Single text stat display/edit component
 *
 * Props:
 * - label
 * - value
 * - onchange (function to call on value change)
 *
 * The stats are put intoa grid of 2 cols, in case
 * of interactive mode, the input spans bot cols
 */
interface Props {
  interactive: boolean;
  label: string;
  value: string;
  onchange: (newValue: string) => void;
  disabled: boolean;
}
const { label, value, onchange, interactive, disabled }: Props = $props();
</script>

{#if interactive}
  <label class="span-cols-2">
    <span>{label}</span>
    <input
      type="text"
      value={value}
      onchange={(e) => onchange((e.target as HTMLInputElement).value)}
      disabled={disabled}
    />
  </label>
{:else}
  <span class="text-small text-high">{label}</span>
  <span class="text-low">{value}</span>
{/if}

<style>
  .span-cols-2 {
    grid-column: span 2;
  }
</style>

