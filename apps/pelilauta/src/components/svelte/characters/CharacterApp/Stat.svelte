<script lang="ts">
/**
 * Single character stat display/edit component.
 *
 * Shows editable fields when the user is the owner of the character.
 */

import type { CnD20AbilityScore } from '@11thdeg/cn-d20-ability-score';
import type { CharacterStat } from '@schemas/CharacterSheetSchema';
import { isEditing } from '@stores/characters/characterSheetState';
import { character, update } from '@stores/characters/characterStore';
import { uid } from '@stores/session';
import { pushSnack } from '@utils/client/snackUtils';
import { logDebug, logError } from '@utils/logHelpers';
import NumberStat from './NumberStat.svelte';
import TextStat from './TextStat.svelte';
import ToggledStat from './ToggledStat.svelte';

interface Props {
  // The stat to display/edit, from the character sheet
  stat: CharacterStat;
}

const { stat }: Props = $props();

const statValue = $derived.by(() => {
  return $character?.stats[stat.key] ?? stat.value;
});

const owns = $derived.by(() => $character?.owners?.includes($uid) || false);
const canEdit = $derived.by(() => owns && $isEditing);

let saving = $state(false);
let error = $state<string | null>(null);

async function updateStat(key: string, value: string | number | boolean) {
  saving = true;
  error = null;

  if (!$character) return;

  const newStats = { ...$character.stats, [key]: value };

  try {
    await update({ stats: newStats });
  } catch (e) {
    logError('Stat.svelte', `Failed to update stat ${key}`, e);
    error = 'Failed to save';
    // TODO: Rollback state on failure
  } finally {
    saving = false;
  }
}

async function handleChange(key: string, value: string | number | boolean) {
  logDebug('Stat.svelte', 'handleChange', key, value);
  if (!$character) throw new Error('No character loaded');
  const newStats = { ...$character.stats, [key]: value };
  try {
    await update({ stats: newStats });
  } catch (e) {
    logError('Stat.svelte', `Failed to update stat ${key}`, e);
    pushSnack('app:error.generic');
  }
}
</script>

{#if stat}
  {#if stat.type === 'text'}
    <TextStat
      label={stat.key}
      value={String(statValue)}
      interactive={canEdit}
      onchange={(newValue) => updateStat(stat.key, newValue)}
      disabled={saving}
    />
  {:else if stat.type === 'number'}
    <NumberStat key={stat.key} />
  {:else if stat.type === 'toggled'}
    <ToggledStat
      label={stat.key}
      value={Boolean(statValue)}
      interactive={canEdit}
      onchange={(newValue) => updateStat(stat.key, newValue)}
      disabled={saving}
    />
  {:else if stat.type === 'd20_ability_score'}
    <cn-d20-ability-score
      label={stat.key}
      base={Number(statValue)}
      interactive={canEdit}
      oninput={(e: Event) =>
        handleChange(stat.key, (e.target as CnD20AbilityScore).base)}
      disabled={saving}
    ></cn-d20-ability-score>
  {:else}
    <div>{stat.key}</div>
  {/if}
  {#if error}
    <p class="text-error text-small">{error}</p>
  {/if}
{/if}
