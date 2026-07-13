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

<li class="flex flex-row p-1">
  <div class="grow">
    <a href={`/sites/${handout.siteKey}/handouts/${handout.key}`}>
      {handout.title}
    </a>
  </div>
  <span class="flex-none">
    {#each handout?.readers || [] as reader}
      <span style="padding-left: var(--cn-grid)">
        <ProfileLink uid={reader} />
      </span>
    {/each}
  </span>
  <span class="flex-none">
    {toDisplayString(handout.flowTime)}
  </span>
</li>