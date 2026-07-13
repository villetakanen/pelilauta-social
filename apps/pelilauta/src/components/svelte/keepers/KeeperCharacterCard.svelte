<script lang="ts">
import type { Character } from '@schemas/CharacterSchema';
import type { CharacterSheet } from '@schemas/CharacterSheetSchema';

interface Props {
  character: Character;
  sheet: CharacterSheet;
}

const { character, sheet }: Props = $props();

const groups = $derived.by(() => {
  return sheet.statGroups || [];
});

function statsInGroup(group: string | { key: string }) {
  const groupKey = typeof group === 'object' ? group.key : group;
  return sheet.stats.filter((stat) => stat.group === groupKey);
}

function getStatValue(key: string): string | number | boolean {
  return character.stats?.[key] ?? 0;
}
</script>
<cn-card
  title={character.name}
    href={`/characters/${character.key}`}
  >
  {#each groups as group}
    <h4 class="text-caption border-b mb-1">{group}</h4>
    {#if statsInGroup(group).length === 0}
      <p class="text-low text-small">No stats in this group</p>
    {:else}
      {#each statsInGroup(group) as stat}
        {#if stat.type === 'number'}
          <label class="m-0">
            <span class="strong m-0">{stat.key}</span>
            <input 
              type="number" 
              class="stat" 
              value={getStatValue(stat.key)} 
              readonly />
           </label>
        {:else}
          <div style="display:flex; justify-content: space-between;">
            <span class="stat-name">{stat.key}</span>
            <span class="stat-value">{getStatValue(stat.key) ?? '-'}</span>
          </div>
        {/if}
      {/each}
    {/if}
  {/each}
</cn-card>