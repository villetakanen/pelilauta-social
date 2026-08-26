<script lang="ts">
/**
 * ReactionButtonInlineRow — the reply-count link and the reaction button
 * sharing one text-flow row, the way `ThreadInfoSection.astro` composes them.
 * The row states no flex rule of its own: `.text-center` and two inline-level
 * controls are what lay the pair out and centre them.
 *
 * Book: apps/design/src/content/components/cn-reaction-button.mdx
 */
import CnReactionButton from '../../components/CnReactionButton.svelte';

const noop = () => {};
</script>

<div class="text-center">
  <a class="button text" href="#">
    <span>3 replies</span>
  </a>
  <CnReactionButton
    label="Tykkää"
    count={3}
    countLabel="3 tykkäystä"
    onclick={noop}
  />
</div>
