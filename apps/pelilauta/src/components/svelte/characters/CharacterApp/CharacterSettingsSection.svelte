<script lang="ts">
import CharacterSheetSelector from '@components/svelte/keepers/CharacterSheetSelector.svelte';
import { showSettingsPanel } from '@stores/characters/characterSheetState';
import { character, sheet, update } from '@stores/characters/characterStore';

const system = $derived.by(() => $sheet?.system || 'homebrew');
const selectedSheetKey = $derived.by(() => $character?.sheetKey || '');

/**
 * Set the selected character sheet key directly to the character store.
 *
 * Store will handle loading /updating the sheet data as needed.
 *
 * @param key the Firestore document key of the character sheet to select
 */
function setSelectedSheetKey(key: string) {
  if ($character && key !== $character.sheetKey) {
    update({ sheetKey: key });
  }
}
</script>
{#if $showSettingsPanel}
  <section>
    <CharacterSheetSelector 
      {system}
      {selectedSheetKey}
      {setSelectedSheetKey}
    />
  </section>
{/if}