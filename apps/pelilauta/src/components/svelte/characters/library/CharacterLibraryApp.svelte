<script lang="ts">
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
        <cn-icon noun="monsters" xlarge></cn-icon>
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
   <!--div class="full-width">
    §  <div class="toolbar">
        <h4 class="grow">{t('library:sites.title')}</h4>
        <button class="text" aria-label={directionNoun} onclick={toggleOrder}>
          <cn-icon noun={directionNoun}></cn-icon>
        </button>
        <button
          class={filters.orderBy === 'name' ? '' : 'text'}
          onclick={() => filters.orderBy = 'name'}
        >
        {t('entries:site.name')}
        </button>
        <button
          class={filters.orderBy === 'flowTime' ? '' : 'text'}
          onclick={() => filters.orderBy = 'flowTime'}
        >
          {t('entries:site.flowTime')}
        </button>
      </div>
   </div>
   <FilteredSites />
   <div class="full-width mb-2">
      <p>{t('library:sites.count', { count: $userSites.length })}</p>
   </div-->
