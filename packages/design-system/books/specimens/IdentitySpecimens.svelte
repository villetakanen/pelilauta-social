<script lang="ts">
/** Identity Mark book specimens. */
import CnAvatar from '../../components/CnAvatar.svelte';
import { COVER_PLACEHOLDER_URI } from '../../components/cover-placeholder';

let {
  group,
}: {
  group: 'basic' | 'states' | 'sizes' | 'distinct' | 'nick' | 'linked';
} = $props();

/** Nicks across the three languages the community writes in. */
const nicks = ['Ville', 'Åsa', 'Jörgen', 'Kaisa', 'Émile', 'Ruusu'];
</script>

<div class="identity-specimens" data-identity-group={group}>
  {#if group === 'basic'}
    <CnAvatar src={COVER_PLACEHOLDER_URI} nick="Ville" />
  {:else if group === 'states'}
    <div class="row">
      <CnAvatar src={COVER_PLACEHOLDER_URI} nick="Ville" />
      <CnAvatar nick="Ville" />
      <CnAvatar />
      <CnAvatar src="/specimens/this-image-does-not-exist.png" nick="Ville" />
    </div>
  {:else if group === 'sizes'}
    <div class="row">
      <CnAvatar nick="Åsa" size="small" />
      <CnAvatar nick="Åsa" size="medium" />
    </div>
  {:else if group === 'distinct'}
    <div class="row">
      {#each nicks as nick}
        <CnAvatar {nick} />
      {/each}
    </div>
  {:else if group === 'nick'}
    <p>
      <a class="cn-nick" href="#nick-specimen">Ville</a> replied to
      <span class="cn-nick">Åsa</span> in a thread that also links
      <a href="#nick-specimen">somewhere else entirely</a>.
    </p>
  {:else if group === 'linked'}
    <div class="row">
      <a href="#linked-specimen" aria-label="Ville">
        <CnAvatar nick="Ville" aria-hidden />
      </a>
      <CnAvatar nick="Ville" />
    </div>
  {/if}
</div>

<style>
  .identity-specimens {
    display: flex;
    flex-direction: column;
    gap: var(--cn-gap);
    inline-size: 100%;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--cn-gap);
  }

  p {
    margin: 0;
  }
</style>
