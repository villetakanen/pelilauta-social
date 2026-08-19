<script lang="ts">
/**
 * ReactionButtonDemo — a consumer doing what the application does: it receives
 * the native click, decides the new count and pressed state, and supplies them
 * back. The readout prints how many clicks arrived, because the control itself
 * changes nothing — a count that moves without the readout moving would be the
 * component acting on its own, which is exactly what it must not do.
 *
 * Book: apps/design/src/content/components/cn-reaction-button.mdx
 */
import CnReactionButton from '../../components/CnReactionButton.svelte';

let pressed = $state(false);
let count = $state(3);
let clicks = $state(0);

const toggle = () => {
  clicks += 1;
  pressed = !pressed;
  count += pressed ? 1 : -1;
};
</script>

<div class="reaction-button-demo">
  <CnReactionButton
    label="Tykkää"
    {count}
    countLabel={`${count} tykkäystä`}
    {pressed}
    onclick={toggle}
  />
  <p class="text-label" aria-live="polite">Klikkauksia: {clicks}</p>
</div>

<style>
  .reaction-button-demo {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    column-gap: var(--cn-gap);
  }

  .reaction-button-demo p {
    margin-block: 0;
  }
</style>
