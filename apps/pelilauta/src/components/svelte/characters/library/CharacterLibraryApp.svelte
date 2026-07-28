<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import { userCharacters } from 'src/stores/characters/userCharacters';
import { t } from 'src/utils/i18n';
import CharacterCard from '../CharacterCard.svelte';

/**
 * A "Standalone" Svelte app displaying the players character library.
 */
</script>

<div class="content-cards">
  <!-- Header for the list - should be moved to a child component and and have
       sorting controls in place-->
  <header>
    <h2 class="downscaled m-0">{t('library:characters.title')}</h2>
    <p class="downscaled text-low">{t('library:characters.description')}</p>
  </header>

  <!-- Display the characters as cards -->
  {#if $userCharacters.length > 0}
    {#each $userCharacters as character}
      <CharacterCard {character} />
    {/each}
  {:else}
      <section class="secondary border-radius p-2 flex flex-column">
        <Icon noun="monsters" size="xlarge" />
        <p class="downscaled">
          {t('library:characters.empty')}
        </p>
      </section>
    {/if}
  <footer>
    <p class="downscaled text-low">
      {t('library:characters.count', { count: $userCharacters.length })}
    </p>
  </footer>
</div>
