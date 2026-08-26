<!-- src/components/svelte/threads/ThreadListItem.svelte -->
<script lang="ts">
import type { Thread } from '@schemas/ThreadSchema';
import ProfileLink from '@svelte/app/ProfileLink.svelte';
import ThreadSubscriber from '@svelte/threads/ThreadSubscriber.svelte';
import { toDisplayString } from '@utils/contentHelpers';
import { t } from '@utils/i18n';
import { createRichSnippet } from '@utils/snippetHelpers';

interface Props {
  thread: Thread;
}
const { thread }: Props = $props();
</script>

<article class="surface" id={`thread-${thread.key}`}>
  <div class="info">
    <h4>
      <a href={`/threads/${thread.key}`}>
        {thread.title}
      </a>
    </h4>
    <div>
      {#await createRichSnippet( thread.markdownContent || "", { paragraphClasses: ["text-small"] }, )}
        ...
      {:then snippet}
        {@html snippet}
      {/await}
    </div>
    <p class="text-caption">
      <ProfileLink uid={thread.author} />
      {#if thread.tags}
        {#each thread.tags as tag}
          <span class="chip">
            {tag}
          </span>
        {/each}
      {/if}
    </p>
  </div>

  <div class="meta">
    <a href={`/threads/${thread.key}?jumpTo=unread#discussion`}>
      {t("threads:info.flowTime", {
        time: toDisplayString(thread.flowTime),
      })}<br />
      {t("threads:info.replies", { count: thread.replyCount || 0 })}
    </a>
  </div>
  <!-- new items highlight injection -->
  <ThreadSubscriber {thread} />
</article>

<style>
  /*
   * Stopgap. The design system has no listing row yet, so this layout is
   * local. Do not copy it; delete it when a listing row exists.
   * plans/debt/the-design-system-has-no-listing-row.md tracks the gap.
   */

  /*
   * The row: the thread's identity, and its activity beside it where the
   * width allows. The surface carries the padding, and the region carries
   * the rhythm between rows, so neither is restated here.
   */
  article {
    display: grid;
    /* Stacked blocks keep the line rhythm; columns keep the inline gap. */
    gap: var(--cn-line) var(--cn-gap);
    border-radius: var(--cn-border-radius);
  }

  /*
   * The nearest ancestor container is the Golden primary region.
   * A container query cannot read a custom property; the literal restates
   * units.css's --cn-breakpoint-small.
   */
  @container (min-width: 38.75rem) {
    article {
      grid-template-columns: 1.618fr 1fr;
    }
  }

  .info {
    display: grid;
    row-gap: var(--cn-grid);
    align-content: start;
    min-inline-size: 0;
  }

  .meta {
    align-self: start;
  }
</style>
