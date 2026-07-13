<script lang="ts">
import { sheets } from '@stores/characters/sheetsStore';
import { logDebug } from '@utils/logHelpers';

interface Props {
  system: string;
  selected: string | undefined;
  onSelect: (key: string, name: string) => void;
}

const { system, selected, onSelect }: Props = $props();

$effect(() => {
  logDebug('SheetSelect', 'System prop:', system);
});

const filteredSheets = $derived.by(() => {
  logDebug('SheetSelect', 'Sheets store updated:', $sheets);
  const filtered = $sheets.filter((s) => s.system === system);
  logDebug('SheetSelect', 'Filtered sheets:', filtered);
  return filtered;
});
</script>

<div class="sheet-select">
  <button
    class="border p-2"
    class:selected={!selected}
    onclick={() => onSelect('-', 'Markdown only')}
  >
    Markdown only
  </button>
  {#each filteredSheets as sheet}
    <button
      class="border p-2"
      class:selected={selected === sheet.key}
      onclick={() => onSelect(sheet.key, sheet.name)}
    >
      {sheet.name}
    </button>
  {/each}
</div>