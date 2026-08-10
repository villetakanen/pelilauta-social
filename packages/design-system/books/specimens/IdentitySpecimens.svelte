<script lang="ts">
/** Identity Mark book specimens. */
import CnAvatar from '../../components/CnAvatar.svelte';
import { COVER_PLACEHOLDER_URI } from '../../components/cover-placeholder';

let {
  group,
}: {
  group:
    | 'basic'
    | 'states'
    | 'sizes'
    | 'distinct'
    | 'nick'
    | 'linked'
    | 'list'
    | 'list-sizes'
    | 'list-overflow'
    | 'list-wrapped'
    | 'list-anonymous';
} = $props();

/** Nicks across the three languages the community writes in. */
const nicks = ['Ville', 'Åsa', 'Jörgen', 'Kaisa', 'Émile', 'Ruusu'];

/** Enough marks to wrap the list in a book column. */
const crowd = [
  ...nicks,
  'Anni',
  'Björn',
  'Çelik',
  'Daniel',
  'Eeva',
  'Fredrik',
  'Göran',
  'Heli',
];
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
      <CnAvatar nick="Åsa" size="large" />
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
  {:else if group === 'list'}
    <ul class="cn-avatar-list">
      {#each nicks as nick}
        <li>
          <a href="#list-specimen" aria-label={nick}>
            <CnAvatar {nick} src={COVER_PLACEHOLDER_URI} aria-hidden />
          </a>
        </li>
      {/each}
    </ul>
  {:else if group === 'list-sizes'}
    <ul class="cn-avatar-list">
      {#each nicks as nick}
        <li><CnAvatar {nick} size="small" /></li>
      {/each}
    </ul>
    <ul class="cn-avatar-list">
      {#each nicks as nick}
        <li><CnAvatar {nick} size="medium" /></li>
      {/each}
    </ul>
  {:else if group === 'list-overflow'}
    <ul class="cn-avatar-list">
      {#each nicks.slice(0, 4) as nick}
        <li><CnAvatar {nick} /></li>
      {/each}
      <li><span class="cn-avatar-list__overflow" aria-hidden="true">+12</span></li>
    </ul>
    <ul class="cn-avatar-list">
      {#each nicks.slice(0, 4) as nick}
        <li><CnAvatar {nick} size="small" /></li>
      {/each}
      <li>
        <span class="cn-avatar-list__overflow cn-avatar-list__overflow--small" aria-hidden="true">
          +12
        </span>
      </li>
    </ul>
  {:else if group === 'list-wrapped'}
    <ul class="cn-avatar-list">
      {#each crowd as nick}
        <li><CnAvatar {nick} size="small" /></li>
      {/each}
    </ul>
  {:else if group === 'list-anonymous'}
    <!-- The worst case the overlap has to survive: no nick, so no derived
         backdrop, and nothing but the elevation shadow between one mark and the
         next. The overflow count sits in the same flat surface role. -->
    <ul class="cn-avatar-list">
      {#each Array.from({ length: 5 }) as _, index (index)}
        <li><CnAvatar /></li>
      {/each}
      <li><span class="cn-avatar-list__overflow" aria-hidden="true">+9</span></li>
    </ul>
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

  /* Narrow enough that the crowd wraps inside a book column. */
  [data-identity-group="list-wrapped"] .cn-avatar-list {
    max-inline-size: calc(var(--cn-line) * 10);
  }
</style>
