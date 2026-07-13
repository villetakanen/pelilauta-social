<script lang="ts">
import { updateCharacterSheet } from 'src/firebase/client/characterSheets/updateCharacterSheet';
import { characterSheet as sheet } from 'src/stores/characters/characterSheetStore';
import { logDebug, logError } from 'src/utils/logHelpers';

let statGroups = $state<string[]>([]);

const dirty = $derived.by(() => {
  return (
    $sheet && JSON.stringify($sheet.statGroups) !== JSON.stringify(statGroups)
  );
});

$effect(() => {
  // On update of the sheet, override the local state
  if ($sheet) {
    statGroups = $sheet.statGroups || [];
  }
});

async function saveSheet(e: Event) {
  e.preventDefault();
  try {
    const key = $sheet?.key;
    if (!key) throw new Error('Sheet key is required for update');

    await updateCharacterSheet({ key, statGroups });
    logDebug('StatGroupsForm', 'Sheet saved successfully');
  } catch (error) {
    logError('StatGroupsForm', 'Error saving sheet:', error);
  }
}

function addGroup() {
  const groups = [...statGroups];
  groups.push('');
  statGroups = groups;
}

function updateGroup(index: number, value: string) {
  const groups = [...statGroups];
  groups[index] = value;
  statGroups = groups;
}

function removeGroup(index: number) {
  const groups = [...statGroups];
  groups.splice(index, 1);
  statGroups = groups;
}

function moveGroupUp(index: number) {
  if (index === 0) return;
  const groups = [...statGroups];
  [groups[index - 1], groups[index]] = [groups[index], groups[index - 1]];
  statGroups = groups;
}

function moveGroupDown(index: number) {
  if (index === statGroups.length - 1) return;
  const groups = [...statGroups];
  [groups[index], groups[index + 1]] = [groups[index + 1], groups[index]];
  statGroups = groups;
}
</script>

<form onsubmit={saveSheet}>
  <fieldset class="border-radius px-2" class:elevation-1={dirty}>
    <legend>Stat Groups</legend>
    <p class="text-low downscaled mb-2">
      Groups are used to organize stats in the character sheet UI. Create groups like "Attributes", "Skills", etc.
    </p>
    
    {#if statGroups && statGroups.length > 0}
      {#each statGroups as group, i}
        <div class="flex gap-2 mb-2">
          <label class="grow">
            Group Name:
            <input 
              type="text" 
              placeholder="e.g., Attributes, Skills, Combat"
              value={group}
              oninput={(e) => updateGroup(i, (e.target as HTMLInputElement).value)}
              required
            />
          </label>
          <div class="flex flex-none gap-1">
            <button 
              aria-label="Move Group Up"
              type="button" 
              class="button text" 
              disabled={i === 0}
              onclick={() => moveGroupUp(i)}
            >
              <cn-icon noun="arrow-up"></cn-icon>
            </button>
            <button 
              aria-label="Move Group Down"
              type="button" 
              class="button text" 
              disabled={i === statGroups.length - 1}
              onclick={() => moveGroupDown(i)}
            >
              <cn-icon noun="arrow-down"></cn-icon>
            </button>
            <button 
              aria-label="Remove Group"
              type="button" 
              class="button flex-none text" 
              onclick={() => removeGroup(i)}
            >
              <cn-icon noun="delete"></cn-icon>
            </button>
          </div>
        </div>
      {/each}
    {:else}
      <p class="text-low">No stat groups defined yet.</p>
    {/if}
    
    <div class="toolbar justify-end mb-2">
      <button type="button" class="text" onclick={addGroup}>
        <cn-icon noun="add"></cn-icon>
        <span>Add Group</span>
      </button>
      <button type="submit" class="button primary" disabled={!dirty}>
        <cn-icon noun="save"></cn-icon>
        <span>
          save
        </span>
      </button>
    </div>
  </fieldset>
</form>