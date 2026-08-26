<script lang="ts">
import type { Handout } from 'src/schemas/HandoutSchema';
import { toDisplayString } from 'src/utils/contentHelpers';
import ProfileLink from '../../app/ProfileLink.svelte';

/**
 * A <li> item for displaying a single handout in the handout list.
 *
 * Child of a HandoutList component
 */
interface Props {
  /** Site data to initialize the global site store */
  handout: Handout;
}
const { handout }: Props = $props();
</script>

<li class="handout-row">
  <div class="handout-title">
    <a href={`/sites/${handout.siteKey}/handouts/${handout.key}`}>
      {handout.title}
    </a>
  </div>
  <span class="handout-readers">
    {#each handout?.readers || [] as reader}
      <span class="reader-link">
        <ProfileLink uid={reader} />
      </span>
    {/each}
  </span>
  <span class="handout-flowtime">
    {toDisplayString(handout.flowTime)}
  </span>
</li>

<style>
  /*
   * @todo No design-system capability publishes a listing row, so this row
   * states its flex layout locally.
   * Anchored at plans/debt/the-design-system-has-no-listing-row.md.
   */
  .handout-row {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }

  .handout-title {
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  .handout-readers,
  .handout-flowtime {
    flex: 0 0 auto;
  }

  .reader-link {
    padding-inline-start: var(--cn-grid);
  }
</style>