<script lang="ts">
import type { CharacterSheet } from 'src/schemas/CharacterSheetSchema';
import { CHARACTER_SHEETS_COLLECTION_NAME } from 'src/schemas/CharacterSheetSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { logDebug, logError } from 'src/utils/logHelpers';
import { systemToNoun } from 'src/utils/schemaHelpers';

let characterSheets = $state<CharacterSheet[]>([]);
let loading = $state(true);

// Load character sheets on mount
$effect(() => {
  loadCharacterSheets();
});

async function loadCharacterSheets() {
  try {
    const { db } = await import('../../../../firebase/client');
    const { collection, getDocs } = await import('firebase/firestore');
    const { migrateCharacterSheet } = await import(
      'src/schemas/CharacterSheetSchema'
    );

    const snapshot = await getDocs(
      collection(db, CHARACTER_SHEETS_COLLECTION_NAME),
    );

    characterSheets = snapshot.docs.map((doc) => {
      const rawData = { key: doc.id, ...doc.data() };
      // Use migration function to handle old string-based statGroups
      return migrateCharacterSheet({
        ...rawData,
        key: doc.id,
      });
    });

    logDebug('CharacterSheetList', 'Loaded character sheets:', characterSheets);
  } catch (error) {
    logError('CharacterSheetList', 'Failed to load character sheets:', error);
    pushSnack('Failed to load character sheets');
  } finally {
    loading = false;
  }
}

async function deleteCharacterSheet(sheetKey: string, sheetName: string) {
  if (
    !confirm(
      `Are you sure you want to delete "${sheetName}"? This cannot be undone.`,
    )
  ) {
    return;
  }

  try {
    const { db } = await import('../../../../firebase/client');
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, CHARACTER_SHEETS_COLLECTION_NAME, sheetKey));

    // Optimistic update: remove from local array for instant UI feedback
    characterSheets = characterSheets.filter((sheet) => sheet.key !== sheetKey);

    pushSnack('Character sheet deleted successfully');
  } catch (error) {
    logError('CharacterSheetList', 'Failed to delete character sheet:', error);
    pushSnack('Failed to delete character sheet');
  }
}
</script>
<section  class="content-cards">
   <header>
    <h1>Character Sheets</h1>
    <p class="text-low">Admin / Mod only prototype tooling for managing the models for character sheets</p>
    <br>
   </header>
  {#if loading}
    <cn-loader></cn-loader>
  {:else if characterSheets.length === 0}
    <cn-card
      noun="info"
      title="No Sheets Found"      
      >
      <p class="text-low">Create a new character sheet schema to get started.</p>
    </cn-card>
  {:else}
  {#each characterSheets as characterSheet}
          <cn-card 
            href={`/admin/sheets/${characterSheet.key}`}
            noun={systemToNoun(characterSheet.system)}
            title={characterSheet.name || 'Unnamed Sheet Schema'}>
            
            <p class="text-low">
              <strong>System:</strong> {characterSheet.system || 'Unknown'} | Stats: {characterSheet.stats?.length ?? 0} 
            </p>

            <div class="toolbar" slot="actions">
              <button 
                onclick={() => deleteCharacterSheet(characterSheet.key, characterSheet.name)}
                class="button text"
                aria-label="Delete Character Sheet"
              >
                <cn-icon noun="delete"></cn-icon>
              </button>
              <a href={`/admin/sheets/${characterSheet.key}`} class="button text">
                <cn-icon noun="edit"></cn-icon>
                <span>Edit</span>
              </a>
            </div>
          </cn-card>
        {/each}
    {/if}
  </section>