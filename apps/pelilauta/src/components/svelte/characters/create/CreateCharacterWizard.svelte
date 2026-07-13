<script lang="ts">
/*
 * This is a stepped wizard for creating a new character.
 */

import StepsToolbar from '@components/svelte/app/StepsToolbar.svelte';
import SystemSelect from '@components/svelte/sites/SystemSelect.svelte';
import type { Character } from '@schemas/CharacterSchema';
import type { CharacterSheet } from '@schemas/CharacterSheetSchema';
import type { Site } from '@schemas/SiteSchema';
import { sheets } from '@stores/characters/sheetsStore';
import { pushSessionSnack, pushSnack } from '@utils/client/snackUtils';
import { t } from '@utils/i18n';
import { logError } from '@utils/logHelpers';
import SheetSelect from './SheetSelect.svelte';
import SiteSelect from './SiteSelect.svelte';

interface Props {
  siteKey?: string; // Optional site/campaign/game to which the character will be added.
}

const { siteKey: initialSiteKey }: Props = $props();

let step = $state(0); // current step
let system = $state('homebrew');
let sheet = $state('');
let sheetName = $state(t('characters:defaultSheet'));
let siteKey = $state(initialSiteKey || '');
let siteName = $state('-');
let characterName = $state('');
let characterDescription = $state('');
let isCreating = $state(false);

// Selected objects for API call
let selectedSheet: CharacterSheet | null = $state(null);
let selectedSite: Site | null = $state(null);

const steps = ['system', 'sheet', 'site', 'meta'];
const i18nSteps = steps.map((s) => t(`characters:create.steps.${s}.title`));

const valid = $derived.by(() => {
  return characterName && characterName.length > 0;
});

const handleStepClick = (stepIndex: number) => {
  step = stepIndex;
};

async function createCharacter() {
  if (!valid || isCreating) return;

  isCreating = true;

  const { authedPost } = await import('@firebase/client/apiClient');

  try {
    const data: Partial<Character> = {
      name: characterName,
      description: characterDescription,
      stats: {},
    };

    if (selectedSheet) {
      data.sheetKey = selectedSheet.key;
      if (selectedSheet.stats) {
        for (const stat of selectedSheet.stats) {
          if (stat.value !== undefined) {
            if (!data.stats) data.stats = {};
            data.stats[stat.key] = stat.value;
          }
        }
      }
    }
    if (selectedSite) {
      data.siteKey = selectedSite.key;
    }

    const response = await authedPost('/api/characters', data);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    pushSessionSnack(
      t('characters:snacks.characterCreated', {
        charactername: characterName,
      }),
    );
    window.location.href = '/library/characters';
  } catch (error) {
    pushSnack(t('character:create.snacks.errorCreatingCharacter'));
    logError('CreateCharacterWizard', 'Error creating character:', error);
  } finally {
    isCreating = false;
  }
}
</script>

<div class="content-columns">
  <section class="column">
    <StepsToolbar 
      steps={i18nSteps}
      progress={step} 
      onStepClick={handleStepClick} />
    <cn-card
      title={t(`characters:create.steps.${steps[step]}.title`)}
    >
    <p class="text-small text-low mb-2">
      {t(`characters:create.steps.${steps[step]}.description`)}
    </p>
    <div class="my-2 border-t py-2">
    {#if step === 0}
      <div data-testid="character-wizard-system-step">
        <SystemSelect {system} setSystem={(s) => system = s}/>
      </div>
    {:else if step === 1}
      <div data-testid="character-wizard-sheet-step">
        <SheetSelect
          system={system} 
          selected={sheet ?? undefined} 
          onSelect={(key, name) => {
            sheet = key === '-' ? '' : key;
            sheetName = name;
            selectedSheet = key === '-' ? null : $sheets.find(s => s.key === key) || null;
          }} />
      </div>
    {:else if step === 2}
      <div data-testid="character-wizard-site-step">
        <SiteSelect
          selected={siteKey} 
          setSelected={(key, site) => {
            siteKey = key;
            siteName = site?.name || '-';
            selectedSite = site;
          }} />
      </div>
    {:else if step === 3}
      <div data-testid="character-wizard-meta-step">
        <label>
          {t('entries:character.name')}
          <input 
            type="text" 
            placeholder={t('entries:character.placeholders.name')} 
            value={characterName} 
            data-testid="character-name-input"
            oninput={(e) => characterName = (e.target as HTMLInputElement).value} 
            required />
        </label>

        <label>
          {t('entries:character.description')}
          <textarea 
            placeholder={t('entries:character.placeholders.description')}
            data-testid="character-description-input"
            oninput={(e) => characterDescription = (e.target as HTMLTextAreaElement).value}>{characterDescription}</textarea>
        </label>

        <p class="text-small text-low border p-1 mt-2" data-testid="character-summary">
          {t(`meta:systems.${system}`)}<br> 
          {sheetName}<br>
          {siteName}
        </p>
      </div>
    {/if}
      <!-- 
        switch for the screens 
        - Step 1: System Selection
        - Step 2: Sheet Selection (optional, default to md only)
        - Step 3: Site selection (optional, default to none)
        - Step 4: Name and confirmation
      -->
      </div>

      <div class="toolbar" slot="actions">
        <!-- buttons: previous and next/confirm - depending on step -->
        <button 
          disabled={step === 0} 
          class="text"
          data-testid="character-wizard-previous-button"
          onclick={() => step = Math.max(0, step - 1)}>
          {t('actions:previous')}
        </button>
        {#if step < steps.length - 1}
          <button 
            data-testid="character-wizard-next-button"
            onclick={() => step = Math.min(steps.length - 1, step + 1)}>
            {t('actions:next')}
          </button>
        {:else}
          <button 
            class="primary"
            disabled={!valid || isCreating}
            data-testid="character-wizard-create-button"
            onclick={createCharacter}>
            {isCreating ? t('actions:creating') : t('actions:create.character')}
          </button>
        {/if}
      </div>

    </cn-card>
  </section>
</div>