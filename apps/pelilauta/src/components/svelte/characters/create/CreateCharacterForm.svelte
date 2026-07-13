<script lang="ts">
/**
 * A Simple Svelte component for creating a new character entry to the DB.
 * 1. Choose character sheet (or plain un-sheeted character).
 * 2. Press create.
 */

import type { Character } from '@schemas/CharacterSchema';
import type { CharacterSheet } from '@schemas/CharacterSheetSchema';
import type { Site } from '@schemas/SiteSchema';
import { uid } from '@stores/session';
import { pushSessionSnack, pushSnack } from '@utils/client/snackUtils';
import { t } from '@utils/i18n';
import { logError } from '@utils/logHelpers';
import CharacterSheetSelect from './CharacterSheetSelect.svelte';
import SiteSelect from './SiteSelect.svelte';

interface Props {
  siteKey?: string; // Optional site/campaign/game to which the character will be added.
}

const { siteKey }: Props = $props();

// Data states
const characterData: Partial<Character> = $state({
  name: '',
  description: '',
  owners: [$uid],
});

// UX states
let selectedSheetKey = $state('');
let selectedSheet: CharacterSheet | null = $state(null);
let selectedSiteKey = $state(siteKey || '');
let selectedSite: Site | null = $state(null);

const valid = $derived.by(() => {
  return characterData.name && characterData.name.length > 0;
});

function setSelectedSheet(sheetKey: string, sheet: CharacterSheet | null) {
  selectedSheetKey = sheetKey;
  selectedSheet = sheet;
}

function setSelectedSite(siteKey: string, site: Site | null) {
  selectedSiteKey = siteKey;
  selectedSite = site;
}

function setName(e: Event) {
  characterData.name = (e.target as HTMLInputElement).value;
}

function setDescription(e: Event) {
  characterData.description = (e.target as HTMLTextAreaElement).value;
}

async function onsubmit(e: Event) {
  e.preventDefault();

  const { authedPost } = await import('@firebase/client/apiClient');

  try {
    const data: Partial<Character> = {
      ...characterData,
    };
    if (selectedSheet) {
      data.sheet = selectedSheet;
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
        charactername: `${characterData.name}`,
      }),
    );
    window.location.href = '/library/characters';
  } catch (error) {
    pushSnack(t('character:create.snacks.errorCreatingCharacter'));
    logError('CreateCharacterForm', 'Error creating character:', error);
  }
}
</script>

  <div class="content-columns">
    <section class="column surface">
      <h1>{t('characters:create.title')}</h1>
      <p class="downscaled">
        {t('characters:create.description')}
        <a href="/docs/characters">{t('actions:learnMore')}</a>
      </p>
      <form onsubmit={onsubmit} class="flex flex-col">

        <label>
          {t('entries:character.name')}
          <input 
            type="text" 
            placeholder={t('entries:character.placeholders.name')} 
            value={characterData.name} 
            oninput={setName} 
            required />
        </label>



        <CharacterSheetSelect 
          {selectedSheetKey}
          {setSelectedSheet}
        />

        <SiteSelect 
          selected={selectedSiteKey}
          setSelected={setSelectedSite}
        />
        
        <div class="toolbar justify-end">
          <a href="/library/characters" class="button text">
            {t('actions:cancel')}
          </a>
          <button 
            type="submit" 
            class="call-to-action">
            {t('actions:create.character')}
          </button>
        </div>

      </form>
      <!--div class="debug">
        <pre>{JSON.stringify({ characterData, selectedSheet }, null, 2)}</pre>
      </div-->    
    </section>
  </div>
