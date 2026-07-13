<script lang="ts">
import {
  CharacterSheetSchema,
  type CharacterStat,
} from '@schemas/CharacterSheetSchema';
import { characterSheet as sheet } from '@stores/characters/characterSheetStore';

interface Props {
  group: string;
  layout?: 'rows' | 'grid-2' | 'grid-3';
}
const { group, layout = 'rows' }: Props = $props();

const stats = $derived.by(() => {
  return $sheet?.stats.filter((s) => s.group === group) || [];
});

function removeStat(statToRemove: CharacterStat) {
  const updated = { ...$sheet };
  if (!updated?.stats) return;

  // Remove the first matching stat by strict equality of object reference or by matching key+group+type
  const index = updated.stats.findIndex(
    (s) =>
      s === statToRemove ||
      (s.key === statToRemove.key &&
        s.group === statToRemove.group &&
        s.type === statToRemove.type),
  );
  if (index === -1) return;

  updated.stats = [
    ...updated.stats.slice(0, index),
    ...updated.stats.slice(index + 1),
  ];
  sheet.set(CharacterSheetSchema.parse(updated));
}
</script>

<cn-stat-block label={group} {layout}>
  <section class="stat-grid">
    {#each stats as stat}
        <input 
          type="text"
          value="{stat.key}"
          oninput={(e) => {
            const updatedSheet = { ...$sheet };
            if (!updatedSheet.stats) return;
            const statToUpdate = updatedSheet.stats.find((s) => s.key === stat.key);
            if (statToUpdate) {
              statToUpdate.key = (e.target as HTMLInputElement).value;
              sheet.set(CharacterSheetSchema.parse(updatedSheet));
            }
          }}
        />
        <select
          onchange={(e) => {
            const updatedSheet = { ...$sheet };
            if (!updatedSheet.stats) return;
            const statToUpdate = updatedSheet.stats.find((s) => s.key === stat.key);
            if (statToUpdate) {
              statToUpdate.type = (e.target as HTMLSelectElement).value as 'number' | 'text' | 'toggled' | 'd20_ability_score';
              // Reset value to default based on type
              statToUpdate.value = statToUpdate.type === 'number' ? 0 : 
                statToUpdate.type === 'toggled' ? 0 :
                statToUpdate.type === 'd20_ability_score' ? 10 : '';
              sheet.set(CharacterSheetSchema.parse(updatedSheet));
            }
          }}
        >
          <option value="number" selected={stat.type === 'number'}>123</option>
          <option value="text" selected={stat.type === 'text'}>ABC</option>
          <option value="toggled" selected={stat.type === 'toggled'}>0/1</option>
          <option value="d20_ability_score" selected={stat.type === 'd20_ability_score'}>D20-A</option>
        </select>
        <button class="text" aria-label="delete" type="button" onclick={() => removeStat(stat)}>
          <cn-icon noun="delete"></cn-icon>
        </button>
    {/each}
  </section>
</cn-stat-block>

<style>
.stat-grid {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}
</style>