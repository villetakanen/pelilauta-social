<script lang="ts">
/** CnCard book fixtures. Styling here arranges specimens; CnCard renders them. */
import CnCard from '../../components/CnCard.svelte';
import { COVER_PLACEHOLDER_URI } from '../../components/cover-placeholder';

/** A URL guaranteed not to resolve, so the specimen exercises the real error path. */
const BROKEN_COVER = '/card-cover-that-does-not-exist.webp';

let {
  group,
}: {
  group: 'basic' | 'elevation' | 'identity' | 'content' | 'wide' | 'narrow';
} = $props();
</script>

<div class:narrow={group === 'narrow'} class:wide={group === 'wide'} class="card-specimens" data-card-group={group}>
  {#if group === 'basic'}
    <div data-variant="basic">
      <CnCard title="Aamunkoin vartijat" description="A concise preview with the default elevation." />
    </div>
    <div data-variant="linked">
      <CnCard title="Linked expedition" href="#linked-card">
        The article stays passive, so this body could contain another link.
      </CnCard>
    </div>
  {:else if group === 'elevation'}
    {#each [0, 1, 2, 3, 4] as elevation}
      <div data-elevation={elevation}>
        <CnCard title={`Elevation ${elevation}`} elevation={elevation as 0 | 1 | 2 | 3 | 4}>
          The foreground remains readable on this surface.
          {#if elevation === 4}<a href="#elevation-4">System-level action</a>{/if}
        </CnCard>
      </div>
    {/each}
    <div data-variant="notify">
      <CnCard title="New activity" notify>Notification indicator.</CnCard>
    </div>
    <div data-variant="alert">
      <CnCard title="Needs attention" notify alert>Alert takes visual precedence.</CnCard>
    </div>
  {:else if group === 'identity'}
    <div data-variant="noun">
      <CnCard title="Fox without a cover" noun="fox">The noun sits with the title.</CnCard>
    </div>
    <div data-variant="cover">
      <CnCard title="The archipelago" cover={COVER_PLACEHOLDER_URI}>A decorative 16:9 cover.</CnCard>
    </div>
    <div data-variant="cover-noun">
      <CnCard title="The iron tower" href="#cover-card" cover={COVER_PLACEHOLDER_URI} noun="fox">
        The cover and title share one destination and one keyboard focus stop.
      </CnCard>
    </div>
    <div data-variant="cover-failed">
      <CnCard title="The lost chart" cover={BROKEN_COVER} noun="fox">
        The supplied cover could not load, so the system artwork keeps the region's proportions.
      </CnCard>
    </div>
    <div data-variant="cover-noun-alert">
      <CnCard title="The tower needs attention" cover={COVER_PLACEHOLDER_URI} noun="fox" alert>
        The noun remains above the warning flag.
      </CnCard>
    </div>
  {:else if group === 'content'}
    <div data-variant="eyebrow-actions">
      <CnCard title="Sundered Skerry" description="A campaign ready for its next session.">
        {#snippet eyebrow()}<a href="#fantasy">Fantasy campaigns</a>{/snippet}
        <p>Three players have joined.</p>
        {#snippet actions()}
          <a href="#details">Details</a>
          <a href="#join">Join</a>
        {/snippet}
      </CnCard>
    </div>
  {:else if group === 'wide'}
    <div data-variant="wide-cover">
      <CnCard title="The iron tower" href="#wide-cover" cover={COVER_PLACEHOLDER_URI} noun="fox">
        A wide comparison specimen for the v20 cover, headline, and foreground hierarchy.
      </CnCard>
    </div>
  {:else}
    <div data-variant="long-narrow">
      <CnCard title="A title long enough to occupy more than two complete rendered lines" noun="fox">
        The title holds its h4 metrics at this width.
      </CnCard>
    </div>
  {/if}
</div>

<style>
  .card-specimens {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
    align-items: stretch;
    gap: var(--cn-gap);
  }

  .card-specimens > div {
    display: flex;
    min-inline-size: 0;
  }

  .narrow {
    inline-size: min(100%, 17rem);
  }

  .wide {
    inline-size: min(100%, 36rem);
  }
</style>
