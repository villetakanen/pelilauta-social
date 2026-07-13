<script lang="ts">
import { CnToggleButton } from '@11thdeg/cyan-lit';
/*
 * A header component for the CharacterApp microfrontend.
 * Displays character name and edit button if permitted.
 */
import {
  isEditing,
  showSettingsPanel,
} from '@stores/characters/characterSheetState';
import { character, saving } from '@stores/characters/characterStore';
import { uid } from '@stores/session';
import { t } from '@utils/i18n';
import CharacterSettingsSection from './CharacterSettingsSection.svelte';

const canEdit = $derived.by(() => {
  return $character?.owners?.includes($uid);
});
</script>

<header>
  <div class="toolbar">
    <h1 class="mb-0 grow">{$character?.name}</h1>
    {#if canEdit}
      {#if $saving}
        <cn-loader inline></cn-loader>
      {/if}
      <cn-toggle-button
        label={t('characters:sheets.mode.edit')}
        pressed={$isEditing}
        onchange={(e: Event) => isEditing.set((e.target as CnToggleButton).pressed)}
      ></cn-toggle-button>
    {/if}
    <button
      type="button"
      onclick={() => $showSettingsPanel = true}
      aria-label={t('actions:settings')}
    >
      <cn-icon noun="tools"></cn-icon>
    </button>
  </div>
  <p class="text-small text-low">{$character?.description}</p>
  <CharacterSettingsSection />
</header>
