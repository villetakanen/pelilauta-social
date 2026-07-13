<script lang="ts">
/**
 * Single toggled stat display/edit component
 */
interface Props {
  interactive: boolean;
  label: string;
  value: boolean;
  onchange: (newValue: boolean) => void;
  disabled: boolean;
}
const { label, value, onchange, interactive, disabled }: Props = $props();
</script>

{#if interactive}
  <label class="span-cols-2 flex items-center">
    <input
      type="checkbox"
      checked={value}
      onchange={(e) => onchange((e.target as HTMLInputElement).checked)}
      disabled={disabled}
    />
    <span class="ml-2">{label}</span>
  </label>
{:else}
  <span class="text-small text-high">{label}</span>
  <span class="text-low">{value ? '✔️' : '❌'}</span>
{/if}

<style>
  .span-cols-2 {
    grid-column: span 2;
  }
</style>
