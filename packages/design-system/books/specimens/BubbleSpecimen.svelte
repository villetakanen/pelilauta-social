<script lang="ts">
/**
 * BubbleSpecimen — two messages of one conversation, and a control that moves
 * the second one to the other speaker.
 *
 * The first bubble carries both semantic bands: a `header` naming the participant
 * and a `footer` carrying the time, so the reader can see each reaching its edge of
 * the shape. The second is short, which is where the bubble's minimum size shows.
 *
 * Both carry a mark, because the mark is what the tail points at, and the column is
 * wide enough to keep it. `BubbleMarkSpecimen` is the narrow column, where the mark
 * leaves and the message takes the whole row.
 *
 * The control is here because `reply` moves several things at once. A reader
 * comparing two bubbles side by side is reading two compositions; flipping one shows
 * that the tail, the corner, the colours and the mark move together while the
 * message stays as it was.
 *
 * Book: apps/design/src/content/components/cn-bubble.mdx
 */
import CnBubble from '../../components/CnBubble.svelte';

/** Which speaker the second message belongs to. */
let mine = $state(true);
</script>

<div class="bubble-specimen">
  <CnBubble nick="Rauta-Kalle">
    <header>
      <p class="text-label">Rauta-Kalle</p>
    </header>
    <p>Ehditäänkö me pelata torstaina, vai siirretäänkö viikolla?</p>
    <footer>
      <p class="text-label">klo 18.42</p>
    </footer>
  </CnBubble>

  <CnBubble reply={mine} nick="Sanna">
    <header>
      <p class="text-label">Sanna</p>
    </header>
    <p>Ehdin torstaina.</p>
  </CnBubble>

  <button type="button" onclick={() => (mine = !mine)}>
    {mine ? 'Toisen puhujan vastaus' : 'Oma vastaus'}
  </button>
</div>

<style>
  /* The frame is a test rig: a conversation column, not a system width. */
  .bubble-specimen {
    display: grid;
    row-gap: var(--cn-gap);
    /* Near the reading measure a discussion actually gets, and wide enough to
       keep the mark. */
    max-inline-size: 42rem;
  }

  .bubble-specimen button {
    justify-self: start;
  }

  /*
   * A band is a row, so its text carries no block margin of its own. Left with
   * one, the paragraph's margin would collapse out of the band and the band
   * would no longer be what sits against the bubble's edge.
   */
  .bubble-specimen :global(:is(header, footer) p) {
    margin-block: 0;
  }
</style>
