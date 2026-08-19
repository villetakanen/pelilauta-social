<script lang="ts">
/**
 * ReactionButtonSpecimens — every state a review has to see at once, in both
 * presentations: unpressed, pressed, disabled and a zero count. Static on
 * purpose: the buttons render server-side and hold whatever they were given,
 * which is also what the no-JavaScript check reads.
 *
 * Book: apps/design/src/content/components/cn-reaction-button.mdx
 */
import CnReactionButton from '../../components/CnReactionButton.svelte';

const noop = () => {};

const states = [
  { key: 'unpressed', count: 3, countLabel: '3 tykkäystä', pressed: false },
  { key: 'pressed', count: 4, countLabel: '4 tykkäystä', pressed: true },
  {
    key: 'disabled',
    count: 4,
    countLabel: '4 tykkäystä',
    pressed: true,
    disabled: true,
  },
  { key: 'zero', count: 0, countLabel: 'Ei tykkäyksiä', pressed: false },
];
</script>

<div class="reaction-button-specimens">
  {#each [false, true] as small (small)}
    <div class="row" data-size={small ? 'small' : 'default'}>
      {#each states as state (state.key)}
        <CnReactionButton
          label="Tykkää"
          count={state.count}
          countLabel={state.countLabel}
          pressed={state.pressed}
          disabled={state.disabled ?? false}
          {small}
          onclick={noop}
        />
      {/each}
    </div>
  {/each}
</div>

<style>
  .reaction-button-specimens {
    display: grid;
    row-gap: var(--cn-gap);
  }

  .row {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    column-gap: var(--cn-gap);
  }
</style>
