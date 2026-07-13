<script lang="ts">
import { isEditing } from '@stores/characters/characterSheetState';
import { character, updateStat } from '@stores/characters/characterStore';

/**
 * Single number stat display/edit component
 */
interface Props {
  key: string;
  readonly?: boolean; // Override editing state to make stat readonly, f.ex. on Keeper view
}

const { key, readonly }: Props = $props();

const value = $derived.by(() => {
  return $character?.stats[key] ?? 0;
});

function onchange(event: Event) {
  const input = event.target as HTMLInputElement;
  // Must be an integer, no decimals
  const newValue = Number.parseInt(input.value, 10);
  if ($isEditing && !readonly) {
    updateStat(key, newValue);
  }
}
</script>

<label class="m-0">
  <span class="text-h5 m-0">{key}</span>
  <input 
    type="number" 
    class="stat" 
    {value}
    {onchange} 
    readonly={!isEditing || readonly} />
</label>
