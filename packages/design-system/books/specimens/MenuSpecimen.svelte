<script lang="ts">
/**
 * MenuSpecimen — a live CnMenu carrying the two kinds of item a consumer
 * authors: an anchor that navigates, and buttons that run a command. The
 * commanded ones print what arrived, because a command has no visible effect of
 * its own and the reader needs to see the menu close and the command fire.
 *
 * Book: apps/design/src/content/components/cn-menu.mdx
 */
import CnMenu from '../../components/CnMenu.svelte';
import Icon from '../../components/Icon.svelte';

let { inline = false }: { inline?: boolean } = $props();

let performed = $state('—');
</script>

<div class="menu-specimen" data-trigger={inline ? 'dots' : 'kebab'}>
  <CnMenu {inline}>
    <a href="/components/cn-menu">
      <Icon noun="card" decorative />
      <span>Haarauta</span>
    </a>
    <button type="button" onclick={() => (performed = 'Muokkaa')}>
      <Icon noun="font" decorative />
      <span>Muokkaa</span>
    </button>
    <button type="button" onclick={() => (performed = 'Poista')}>
      <Icon noun="delete" decorative />
      <span>Poista</span>
    </button>
  </CnMenu>
  <p class="text-label" aria-live="polite">Viimeisin komento: {performed}</p>
</div>

<style>
  .menu-specimen {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }

  .menu-specimen p {
    margin: 0;
  }
</style>
