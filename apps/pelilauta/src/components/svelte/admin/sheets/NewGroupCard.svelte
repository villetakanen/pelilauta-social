<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import { CharacterSheetSchema } from '@schemas/CharacterSheetSchema';
import { characterSheet as sheet } from 'src/stores/characters/characterSheetStore';

// runes reactive local state
let groupName = $state('');

function addGroup() {
  const name = String(groupName).trim();
  if (!name) return;

  const updated = { ...$sheet };
  if (!updated) return;
  if (!updated.statGroups) updated.statGroups = [];

  if (updated.statGroups.some((g) => g.key === name)) return;

  updated.statGroups = [
    ...updated.statGroups,
    { key: name, layout: 'rows' as const },
  ];
  sheet.set(CharacterSheetSchema.parse(updated));
  groupName = '';
}
</script>

<cn-card>
  <div class="flex items-center">
    <Icon noun="card" size="large" />
  </div>
  <label>
    <span>Group Name</span>
    <input type="text" bind:value={groupName} placeholder="e.g., Attributes" />
  </label>
  <div slot="actions" class="toolbar items-center">
  <button type="button" class="text" onclick={() => addGroup()} disabled={!groupName.trim()}>
      <Icon noun="add" />
      <span>New Group</span>
    </button>
  </div>
</cn-card>
