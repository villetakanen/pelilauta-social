<script lang="ts">
import {
  CharacterSheetSchema,
  type StatGroup,
} from '@schemas/CharacterSheetSchema';
import {
  dirty,
  load,
  save,
  characterSheet as sheet,
} from 'src/stores/characters/characterSheetStore';
import { appMeta } from 'src/stores/metaStore/metaStore';
import { pushSnack } from 'src/utils/client/snackUtils';
import { uid } from '../../../../stores/session';
import WithAuth from '../../app/WithAuth.svelte';
import NewGroupCard from './NewGroupCard.svelte';
import SheetInfoForm from './SheetInfoForm.svelte';
import StatsSection from './StatsSection.svelte';

export interface Props {
  sheetKey: string;
}
const { sheetKey }: Props = $props();
const allow = $derived.by(() => $appMeta.admins.includes($uid));

/**
 * Add a new stat with an empty key to the given group unless one already exists.
 */
function addStat(groupKey: string) {
  const updated = { ...$sheet };
  if (!updated.stats) updated.stats = [];

  // Only add if there isn't an existing stat with empty key in this group
  const hasEmpty = updated.stats.some(
    (s) => s.group === groupKey && s.key === '',
  );
  if (hasEmpty) return;

  updated.stats = [
    ...updated.stats,
    {
      type: 'number',
      key: '-',
      value: 0,
      group: groupKey,
    },
  ];

  // Validate and set the sheet atom
  sheet.set(CharacterSheetSchema.parse(updated));
}

function groupHasStats(groupKey: string) {
  return ($sheet?.stats || []).some((s) => s.group === groupKey);
}

function removeGroup(groupKey: string) {
  // Only allow removing empty groups
  if (groupHasStats(groupKey)) return;

  const updated = { ...$sheet };
  if (!updated?.statGroups) return;

  updated.statGroups = updated.statGroups.filter((g) => g.key !== groupKey);
  sheet.set(CharacterSheetSchema.parse(updated));
}

function updateGroupLayout(
  groupKey: string,
  layout: 'rows' | 'grid-2' | 'grid-3',
) {
  const updated = { ...$sheet };
  if (!updated?.statGroups) return;

  const groupIndex = updated.statGroups.findIndex((g) => g.key === groupKey);
  if (groupIndex === -1) return;

  updated.statGroups[groupIndex] = {
    ...updated.statGroups[groupIndex],
    layout,
  };
  sheet.set(CharacterSheetSchema.parse(updated));
}

/**
 * Subscribe to the character sheet data when the component is mounted and the user is authorized.
 * The sheet store is used by the children components to display and edit the sheet.
 */
$effect(() => {
  if (allow) {
    try {
      load(sheetKey);
    } catch (error) {
      pushSnack({
        message: `Failed to subscribe to sheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
});
</script>

<WithAuth {allow}>
  <div class="content-sheet border p-1">
    <header class="pb-2">
      <SheetInfoForm />
      <br>
    </header>

    <section class="blocks">
      {#each $sheet?.statGroups || [] as group }
        <div class="p-1 surface">
          <div class="toolbar pt-0 mt-0">
            <h4 class="text-h5">{group.key}</h4>
            <select 
              bind:value={group.layout}
              onchange={() => updateGroupLayout(group.key, group.layout)}
            >
              <option value="rows">Rows (single column)</option>
              <option value="grid-2">Grid 2-column</option>
              <option value="grid-3">Grid 3-column</option>
            </select>
            <button
              type="button"
              class="text"
              aria-label="delete"
              onclick={() => removeGroup(group.key)}
              disabled={groupHasStats(group.key)}
            >
              <cn-icon noun="delete"></cn-icon>
            </button>
          </div>
          <StatsSection group={group.key} layout={group.layout} />
          <div class="toolbar items-center">
                <button
                  type="button"
                  class="text"
                  onclick={() => addStat(group.key)}
                >
                  <cn-icon noun="add"></cn-icon>
                  <span>New Stat</span>
                </button>
          </div>
        </div>
      {/each}

      <div>
        <NewGroupCard />
      </div>
    </section>
  </div>
</WithAuth>

