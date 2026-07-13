<script lang="ts">
import { createCharacterSheet } from 'src/stores/characters/characterSheetStore';
import { pushSnack } from 'src/utils/client/snackUtils';
import { logError } from 'src/utils/logHelpers';

let creating = $state(false);

async function handleCreateCharacterSheet() {
  creating = true;

  try {
    const newCharacterSheet = {
      key: '-',
      name: 'New Character Sheet Schema',
      system: '-',
      stats: [],
      extras: [],
    };

    const newKey = await createCharacterSheet(newCharacterSheet);

    // Navigate to the new character sheet editor
    window.location.href = `/admin/sheets/${newKey}`;

    pushSnack('Character sheet created successfully');
  } catch (error) {
    logError('SheetFabs', 'Failed to create character sheet:', error);
    pushSnack('Failed to create character sheet');
  } finally {
    creating = false;
  }
}
</script>

<div class="fab-tray">
  <button 
    class="fab" 
    onclick={handleCreateCharacterSheet} 
    disabled={creating}
    aria-label="Create new sheet" 
    data-tooltip="Create new sheet"
  >
    <cn-icon noun="add"></cn-icon>
    <span class="sr-only">Create new sheet</span>
  </button>
</div>
