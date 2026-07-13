<script lang="ts">
import { authedDelete } from 'src/firebase/client/apiClient';
import {
  character,
  loading,
  subscribe,
} from 'src/stores/characters/characterStore';
import { pushSessionSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logDebug, logError } from 'src/utils/logHelpers';

interface Props {
  characterKey: string;
}
const { characterKey }: Props = $props();

$effect(() => {
  logDebug('ConfirmCharacterDeletion', 'Loading character:', characterKey);
  subscribe(characterKey);
});

async function handleSubmit(event: Event) {
  event.preventDefault();
  try {
    const response = await authedDelete(`/api/characters/${characterKey}`);
    if (response.ok) {
      pushSessionSnack(t('characters:confirmDeletion.success'));
      window.location.href = '/library/characters';
    } else {
      logError('Failed to delete character', {
        status: response.status,
        statusText: response.statusText,
      });
      pushSessionSnack(t('characters:confirmDeletion.error'));
    }
  } catch (error) {
    logError('Failed to delete character', {
      error: error instanceof Error ? error.message : String(error),
      characterKey,
    });
    pushSessionSnack(t('characters:confirmDeletion.error'));
  }
}
</script>

<div class="content-columns">
  {#if $loading}
    <section class="elevation-1 border-radius p-2">
      <h1 class="mt-0">{t('characters:confirmDeletion.title')}</h1>
      <p>Loading character...</p>
    </section>
  {:else if $character}
    <form class="elevation-1 border-radius p-2" onsubmit={handleSubmit}>
      <h1 class="mt-0">{t('characters:confirmDeletion.title')}</h1>
      <p>{t('characters:confirmDeletion.description', { characterName: $character.name })}</p>
      
      <div class="toolbar justify-end">
        <a href={`/characters/${characterKey}`} class="button text">
          <cn-icon noun="arrow-left"></cn-icon>
          <span>{t('actions:cancel')}</span>
        </a>
        <button type="submit" class="button primary">
          <cn-icon noun="delete"></cn-icon>
          <span>{t('actions:delete')}</span>
        </button>
          
      </div>
    </form>
  {:else}
    <section class="elevation-1 border-radius p-2">
      <h1 class="mt-0">{t('characters:confirmDeletion.title')}</h1>
      <p>{t('characters:snacks.characterNotFound')}</p>
      <div class="toolbar justify-end">
        <a href="/library/characters" class="button text">
          <cn-icon noun="arrow-left"></cn-icon>
          <span>{t('actions:cancel')}</span>
        </a>
      </div>
    </section>
  {/if}
</div>