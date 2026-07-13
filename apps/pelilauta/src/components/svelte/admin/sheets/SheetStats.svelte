<script lang="ts">
import type { CnToggleButton } from '@11thdeg/cyan-lit';
import { updateCharacterSheet } from 'src/firebase/client/characterSheets/updateCharacterSheet';
import {
  type CharacterStat,
  CharacterStatSchema,
} from 'src/schemas/CharacterSheetSchema';
import { characterSheet as sheet } from 'src/stores/characters/characterSheetStore';
import { logDebug, logError } from 'src/utils/logHelpers';

let stats = $state<CharacterStat[]>([]);
let expandedGroups = $state<Set<string>>(new Set());

const dirty = $derived.by(() => {
  return $sheet && JSON.stringify($sheet.stats) !== JSON.stringify(stats);
});

const availableGroups = $derived.by(() => {
  return $sheet?.statGroups || [];
});

const groupedStats = $derived.by(() => {
  const grouped: Record<string, CharacterStat[]> = {};
  const unlisted: CharacterStat[] = [];

  // Initialize groups
  for (const group of availableGroups) {
    grouped[group] = [];
  }

  // Sort stats into groups
  for (const stat of stats) {
    if (stat.group && availableGroups.includes(stat.group)) {
      grouped[stat.group].push(stat);
    } else {
      unlisted.push(stat);
    }
  }

  return { grouped, unlisted };
});

$effect(() => {
  // On update of the sheet, override the local state
  if ($sheet) {
    stats = $sheet.stats || [];
  }
});

async function saveSheet(e: Event) {
  e.preventDefault();
  try {
    const key = $sheet?.key;
    if (!key) throw new Error('Sheet key is required for update');

    await updateCharacterSheet({ key, stats });
    logDebug('StatsForm', 'Sheet saved successfully');
  } catch (error) {
    logError('StatsForm', 'Error saving sheet:', error);
  }
}

function addStat(groupName: string) {
  const newStat: CharacterStat = {
    type: 'number',
    key: '',
    value: 0,
    group: groupName,
  };
  stats = [...stats, newStat];

  // Expand the group so the user can see the newly added stat
  if (!expandedGroups.has(groupName)) {
    expandedGroups.add(groupName);
    expandedGroups = new Set(expandedGroups);
  }
}

function updateStat(index: number, updates: Partial<CharacterStat>) {
  const updatedStats = [...stats];
  const stat = updatedStats[index];

  const updated = CharacterStatSchema.parse({
    ...stat,
    ...updates,
  });

  updatedStats[index] = updated;
  stats = updatedStats;
}

function removeStat(index: number) {
  const updatedStats = [...stats];
  updatedStats.splice(index, 1);
  stats = updatedStats;
}

function moveStatToGroup(statIndex: number, newGroup: string) {
  updateStat(statIndex, { group: newGroup });
}

function getStatIndex(stat: CharacterStat): number {
  return stats.indexOf(stat);
}

function handleTypeChange(e: Event, statIndex: number) {
  const type = (e.target as HTMLSelectElement).value as
    | 'number'
    | 'toggled'
    | 'derived'
    | 'd20_ability_score';

  if (type === 'number') {
    updateStat(statIndex, { type, value: 0 });
  } else if (type === 'toggled') {
    updateStat(statIndex, { type, value: false });
  } else if (type === 'derived') {
    updateStat(statIndex, { type, formula: '' });
  } else if (type === 'd20_ability_score') {
    updateStat(statIndex, {
      type,
      baseValue: 10,
      value: 0,
      hasProficiency: false,
    });
  }
}

function toggleGroup(groupName: string) {
  if (expandedGroups.has(groupName)) {
    expandedGroups.delete(groupName);
  } else {
    expandedGroups.add(groupName);
  }
  expandedGroups = new Set(expandedGroups);
}

function isGroupExpanded(groupName: string): boolean {
  return expandedGroups.has(groupName);
}
</script>

<form onsubmit={saveSheet} class="column-l">
  <fieldset class="border-radius px-2 mt-2" class:elevation-1={dirty}>
    <legend>Stats</legend>
    <p class="text-low downscaled mb-2">
      Define the stats for this character sheet. Stats must be assigned to a stat group.
    </p>

    {#if availableGroups.length === 0}
      <cn-card noun="warning" title="No Stat Groups Available">
        <p class="text-low">You must create stat groups before you can add stats.</p>
      </cn-card>
    {:else}
      <!-- Display stats grouped by their groups -->
      {#each availableGroups as groupName}
        <div>
          <div class="toolbar align-center p-0 m-0">
            <h4 class="m-0 grow">{groupName} ({groupedStats.grouped[groupName]?.length || 0})</h4>
            <button 
              type="button" 
              class="text"
              onclick={() => toggleGroup(groupName)}
              aria-expanded={isGroupExpanded(groupName)}
            >
              <cn-icon noun={isGroupExpanded(groupName) ? 'arrow-up' : 'arrow-down'}></cn-icon>
              <span>{isGroupExpanded(groupName) ? 'Collapse' : 'Expand'}</span>
            </button>
            <button type="button" class="text" onclick={() => addStat(groupName)}>
              <cn-icon noun="add"></cn-icon>
              <span>Add</span>
            </button>
          </div>
          
          {#if isGroupExpanded(groupName)}
            {#if groupedStats.grouped[groupName] && groupedStats.grouped[groupName].length > 0}
            {#each groupedStats.grouped[groupName] as stat}
              {@const statIndex = getStatIndex(stat)}
              <div class="flex flex-no-wrap">
                  <label class="grow">
                    Key:
                    <input 
                      type="text" 
                      placeholder="e.g., strength, hit_points"
                      value={stat.key}
                      oninput={(e) => updateStat(statIndex, { key: (e.target as HTMLInputElement).value })}
                      required
                    />
                  </label>
                  
                  <label class="flex-none">
                    Type:
                    <select 
                      value={stat.type}
                      onchange={(e) => handleTypeChange(e, statIndex)}
                    >
                      <option value="number">Number</option>
                      <option value="toggled">Toggle</option>
                      <option value="derived">Derived</option>
                      <option value="d20_ability_score">D20 Ability Score</option>
                    </select>
                  </label>
                  
                  <button 
                    aria-label="Remove Stat"
                    type="button" 
                    class="button flex-none text" 
                    onclick={() => removeStat(statIndex)}
                  >
                    <cn-icon noun="delete"></cn-icon>
                  </button>
                </div>

                <!-- Additional fields for D20 Ability Score stats -->
                {#if stat.type === 'd20_ability_score'}
                    <div class="border p-1 border-radius-small ml-2 mb-2">
                      <cn-toggle-button 
                        label="Proficiency"
                        checked={stat.hasProficiency || false}
                        onchange={(e:Event) => updateStat(statIndex, { hasProficiency: (e.target as CnToggleButton).pressed })}
                      ></cn-toggle-button>
                      <p class="text-low text-caption m-0">Supports proficiency (e.g., saving throws)</p>
                  </div>
                {/if}

            {/each}
          {:else}
            <p class="text-low mb-2">No stats in this group.</p>
          {/if}
          {/if}

          
        </div>
      {/each}

      <!-- Display unlisted stats -->
      {#if groupedStats.unlisted.length > 0}
        <div class="mb-4">
          <h4 class="mb-2 text-warning">Unlisted Stats</h4>
          <p class="text-low downscaled mb-2">
            These stats don't belong to any existing stat group. You can only move them to a valid group.
          </p>
          
          {#each groupedStats.unlisted as stat}
            {@const statIndex = getStatIndex(stat)}
            <div class="flex gap-2 mb-2 p-2 border-radius elevation-1 bg-warning-subtle">
              <div class="grow">
                <strong>{stat.key || 'Unnamed Stat'}</strong>
                <span class="text-low"> ({stat.type})</span>
                {#if stat.group}
                  <span class="text-low"> - Group: {stat.group}</span>
                {/if}
              </div>
              
              <div class="flex flex-none gap-1">
                <label>
                Move to group:
                <select 
                  value=""
                  onchange={(e) => moveStatToGroup(statIndex, (e.target as HTMLSelectElement).value)}
                  aria-label="Move to group"
                >
                  <option value="" disabled>Move to group...</option>
                  {#each availableGroups as group}
                    <option value={group}>{group}</option>
                  {/each}
                </select>
                </label>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    <div class="toolbar justify-end mb-2">
      <button type="submit" class="button primary" disabled={!dirty}>
        <cn-icon noun="save"></cn-icon>
        <span>
          save
        </span>
      </button>
    </div>
  </fieldset>
</form>
