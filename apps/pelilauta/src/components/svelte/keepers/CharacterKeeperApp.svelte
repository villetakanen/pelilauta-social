<script lang="ts">
import {
  CHARACTERS_COLLECTION_NAME,
  type Character,
} from '@schemas/CharacterSchema';
import type { CharacterSheet } from '@schemas/CharacterSheetSchema';
import { CHARACTER_SHEETS_COLLECTION_NAME } from '@schemas/CharacterSheetSchema';
import { characterKeeperStatus } from '@stores/keepers/characterKeeperStatusStore';
import { charactersInKeeper } from '@stores/keepers/characterKeeperStore';
import { site, update } from '@stores/site';
import { t } from '@utils/i18n';
import { logDebug, logError } from '@utils/logHelpers';
import { onMount } from 'svelte';
import CharacterSheetSelector from './CharacterSheetSelector.svelte';
import KeeperCharacterCard from './KeeperCharacterCard.svelte';

interface Props {
  siteKey: string;
}
const { siteKey }: Props = $props();

let sheet = $state<CharacterSheet | null>(null);
let selectedSheetKey = $state<string>($site?.characterKeeperSheetKey || '');

async function getSheet(sheetKey: string) {
  const { doc, getDoc } = await import('firebase/firestore');
  const { db } = await import('@firebase/client');
  const sheetRef = doc(db, CHARACTER_SHEETS_COLLECTION_NAME, sheetKey);
  const sheetSnap = await getDoc(sheetRef);
  if (sheetSnap.exists()) {
    sheet = sheetSnap.data() as CharacterSheet;
  }
}

async function syncCharacters() {
  characterKeeperStatus.setKey('loading', true);
  characterKeeperStatus.setKey('error', null);
  const { collection, query, where, onSnapshot } = await import(
    'firebase/firestore'
  );
  const { db } = await import('@firebase/client');
  const q = query(
    collection(db, CHARACTERS_COLLECTION_NAME),
    where('siteKey', '==', siteKey),
  );

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const characters: Character[] = [];
      querySnapshot.forEach((doc) => {
        characters.push(doc.data() as Character);
      });
      charactersInKeeper.set(characters);
      characterKeeperStatus.setKey('loading', false);
      characterKeeperStatus.setKey('lastUpdated', new Date());
      logDebug('CharacterKeeperApp', 'Characters updated', characters);
    },
    (error) => {
      logError('CharacterKeeperApp', 'Error syncing characters', error);
      characterKeeperStatus.setKey('loading', false);
      characterKeeperStatus.setKey('error', error.message);
    },
  );

  return unsubscribe;
}

function setSelectedSheetKey(key: string) {
  selectedSheetKey = key;
  update({ characterKeeperSheetKey: key });
  if (key) {
    getSheet(key);
  } else {
    sheet = null;
  }
}

// Stale-while-revalidate implementation
onMount(() => {
  logDebug('CharacterKeeperApp', 'onMount - Site data:', $site);
  logDebug('CharacterKeeperApp', 'Site system:', $site?.system);
  if (selectedSheetKey) {
    getSheet(selectedSheetKey);
  }
  const unsubscribe = syncCharacters();
  return () => {
    logDebug('CharacterKeeperApp', 'onUnmount');
    unsubscribe.then((unsub) => unsub());
  };
});
</script>

<div class="content-cards">
  <header class=toolbar>
    <h1 class="text-h3">{t('site:keeper.title')}</h1>
    <CharacterSheetSelector
        system={$site?.system || 'homebrew'}
        {selectedSheetKey}
        {setSelectedSheetKey}
    />
    {#if $characterKeeperStatus.loading}
      <cn-loader></cn-loader>
    {/if}
  </header>
  
  {#if $characterKeeperStatus.error}
    <cn-card
      noun="error"
      title={t('site:keeper.error.title')}
      class="secondary"
      description={$characterKeeperStatus.error}
    >
    </cn-card>
  {/if}

  {#if sheet && $charactersInKeeper.length > 0}
    {#each $charactersInKeeper as character}
      <KeeperCharacterCard {character} {sheet} />
    {/each}  
  {:else if sheet && $charactersInKeeper.length === 0}
    <cn-card
      noun="info"
      title={t('site:keeper.noCharacters.title')}
      class="secondary"
      description={t('site:keeper.noCharacters.description')}
    >
    </cn-card>
  {:else}
    <div></div>
    <cn-card
      noun="info"
      title={t('site:keeper.noSheet.title')}
      class="secondary"
      description={t('site:keeper.noSheet.description')}
    >
    </cn-card>
  {/if}
  {#if $characterKeeperStatus.lastUpdated}
    <footer>
      <p class="text-small text-low text-right">
        {t('site:keeper.lastUpdated', { date: $characterKeeperStatus.lastUpdated.toLocaleString() })}
      </p>
    </footer>
  {/if}
</div>

