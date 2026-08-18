<script lang="ts">
/**
 * CnBubble — one message, shaped as a part of a conversation.
 *
 * The component holds no state and listens to nothing. The composition decides
 * whether the message belongs to the reader, and passes that through `reply`,
 * which turns the bubble's tail and its square corner to the other edge.
 *
 * The message is an `article`, because it is a self-contained part of a document —
 * one unit to a reader walking the landmarks, and one thing to copy or share. The
 * participant's name, the timestamp and the actions are the composition's, and a
 * leading `header` or a trailing `footer` reaches the bubble's edge so those bands
 * read as parts of the shape rather than as content inset from it.
 *
 * The root is the row, so the mark can stand beside the article where the tail
 * points. CnBubble builds the mark from `nick` and `avatar` rather than accepting a
 * built one: a mark it constructs is decoration it can guarantee, carrying no link
 * and no announcement, and the `header` remains the only place the participant is
 * named.
 *
 * The row is the query boundary, so the mark answers the width the composition
 * gives the message. Below the small breakpoint the mark leaves the layout and the
 * message takes the whole row. Identity is in the header, so nothing is lost with
 * it, which is why a container query may decide this at all.
 */
import type { Snippet } from 'svelte';
import CnAvatar from './CnAvatar.svelte';

let {
  reply = false,
  nick = '',
  avatar = '',
  children,
}: {
  /** Presents the message as written by the current reader. */
  reply?: boolean;
  /** The participant's nick, which the mark reduces to initials. */
  nick?: string;
  /** The participant's picture, when one exists. */
  avatar?: string;
  /** The message: its bands, its body, whatever the composition renders. */
  children?: Snippet;
} = $props();

const marked = $derived(Boolean(nick || avatar));
</script>

<div class="cn-bubble-row" class:reply>
  {#if marked}
    <div class="cn-bubble-mark" aria-hidden="true">
      <CnAvatar src={avatar} {nick} size="medium" aria-hidden />
    </div>
  {/if}
  <article class="cn-bubble" class:reply>
    {#if children}{@render children()}{/if}
  </article>
</div>

<style>
  .cn-bubble-row {
    /*
     * The row is what the mark queries: its inline size is the width the
     * composition gave the message, and it does not depend on the mark.
     */
    container-type: inline-size;
    display: flex;
    align-items: flex-start;
    /* The mark stands beyond the margin the tail occupies. */
    column-gap: var(--cn-gap);
  }

  .cn-bubble-row.reply {
    flex-direction: row-reverse;
  }

  .cn-bubble {
    /* The tail is positioned against this box, in the margin beside it. */
    position: relative;
    flex: 1 1 auto;
    /* The reserved gap, on the edge the tail points out of. */
    margin-inline: var(--cn-gap) 0;
    padding-block: var(--cn-gap) var(--cn-grid);
    padding-inline: var(--cn-gap);
    /* A one-word message is still a bubble. */
    min-block-size: calc(var(--cn-gap) * 4);
    border-radius: var(--cn-border-radius-medium);
    /* Square where the tail meets it: the shape says which side spoke. */
    border-start-start-radius: 0;
    background: var(--cn-bubble);
    color: var(--cn-on-bubble);
  }

  .cn-bubble.reply {
    margin-inline: 0 var(--cn-gap);
    border-start-start-radius: var(--cn-border-radius-medium);
    border-start-end-radius: 0;
    background: var(--cn-reply-bubble);
    color: var(--cn-on-reply-bubble);
  }

  /*
   * Decoration, and sized by the mark it holds. It never shrinks, so a long
   * message cannot squeeze the picture out of recognisability.
   */
  .cn-bubble-mark {
    display: none;
    flex: 0 0 auto;
  }

  @container (min-width: 38.7501rem) {
    .cn-bubble-mark {
      display: block;
    }
  }

  /*
   * The tail: a zero-sized box whose one tinted border edge is the triangle,
   * declared logically so it turns with the writing direction. Its block-end
   * width tapers the triangle downward, away from the corner it grows out of.
   */
  .cn-bubble::after {
    content: '';
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: calc(-1 * var(--cn-gap));
    inline-size: 0;
    block-size: 0;
    border-style: solid;
    border-width: 0;
    border-block-end-width: var(--cn-gap);
    border-inline-end-width: var(--cn-gap);
    border-color: transparent;
    border-inline-end-color: var(--cn-bubble);
  }

  .cn-bubble.reply::after {
    inset-inline: auto calc(-1 * var(--cn-gap));
    border-inline-end-width: 0;
    border-inline-start-width: var(--cn-gap);
    border-inline-start-color: var(--cn-reply-bubble);
  }

  /* The bubble's padding opens the message; the first line does not add to it. */
  .cn-bubble > :global(*:first-child) {
    margin-block-start: 0;
  }

  /*
   * A semantic band belongs to the shape. Releasing the padding it sits in puts
   * a byline against the top edge and a timestamp row against the bottom one.
   */
  .cn-bubble > :global(header:first-child) {
    margin-block-start: calc(-1 * var(--cn-gap));
  }

  .cn-bubble > :global(footer:last-child) {
    margin-block-end: calc(-1 * var(--cn-grid));
  }
</style>
