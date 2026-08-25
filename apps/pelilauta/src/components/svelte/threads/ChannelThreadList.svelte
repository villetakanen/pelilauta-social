<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import type { Channel } from '@schemas/ChannelSchema';
import type { Thread } from '@schemas/ThreadSchema';
import { parseThread } from '@schemas/ThreadSchema';
import { uid } from '@stores/session';
import { t } from '@utils/i18n';
import { logDebug, logError } from '@utils/logHelpers';
import ChannelSearchBox from './ChannelSearchBox.svelte';
import ThreadListItem from './ThreadListItem.svelte';

interface Props {
  channel: Channel;
  initialThreads: Thread[];
  initialLastFlowTime: number;
  hasError: boolean;
}

const { channel, initialThreads, initialLastFlowTime, hasError }: Props =
  $props();

// Component state
let threads = $state([...initialThreads]);
let lastFlowTime = $state(initialLastFlowTime);
let isLoading = $state(false);
let hasMore = $state(initialThreads.length === 11);
let error = $state<string | null>(null);

async function loadMoreThreads() {
  if (isLoading || !hasMore) return;

  isLoading = true;
  error = null;

  try {
    const response = await fetch(
      `/api/threads.json?channel=${channel.slug}&startAt=${lastFlowTime}&limit=11`,
    );

    if (!response.ok) {
      throw new Error(`Failed to load threads: ${response.status}`);
    }

    const threadsData = await response.json();
    const newThreads = threadsData.map((thread: Record<string, unknown>) =>
      parseThread(thread, String(thread.key)),
    );

    if (newThreads.length > 0) {
      threads = [...threads, ...newThreads];
      lastFlowTime = newThreads[newThreads.length - 1].flowTime;
      hasMore = newThreads.length === 11;
    } else {
      hasMore = false;
    }

    logDebug('ChannelThreadList', `Loaded ${newThreads.length} more threads`);
  } catch (err) {
    logError('ChannelThreadList', 'Failed to load more threads:', err);
    error = err instanceof Error ? err.message : 'Failed to load more threads';
  } finally {
    isLoading = false;
  }
}
</script>

{#if !hasError}
<!--
  The page's Golden container reaches through the island, so the listing and
  the channel card are this component's two top-level elements: the readable
  primary and the small secondary. Each region is already a content area, so
  the rows below need no rhythm of their own.
-->
<section>
  <header class="surface">
    <div>
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <a href="/">{t('app:shortname')}</a>
          </li>
          <li>
            <a href="/channels/">{t('threads:forum.title')}</a>
          </li>
        </ol>
      </nav>
      <h1 class="text-h3">{channel.name}</h1>
    </div>

    <!-- One flex item: the search box stacks its login prompt under the form. -->
    <div class="search">
      <ChannelSearchBox {channel} />
    </div>
  </header>

  {#each threads as thread (thread.key)}
    <ThreadListItem {thread} />
  {/each}

  {#if hasMore}
    <button
      class="load-more"
      onclick={loadMoreThreads}
      disabled={isLoading}
    >
      {#if isLoading}
        <CnLoader inline noun={channel.icon} />
      {:else}
        <CnIcon noun={channel.icon} />
      {/if}
      <span>{isLoading ? t('actions:loading') : t('actions:loadMore')}</span>
    </button>
  {/if}

  {#if error}
    <div class="text-center">
      <p>{error}</p>
      <button onclick={loadMoreThreads}>
        <CnIcon noun={channel.icon} />
        <span>{t('actions:retry')}</span>
      </button>
    </div>
  {/if}
</section>

<aside>
  <article class="surface">
    <CnIcon noun={channel.icon} size="large" />
    <h2>{channel.name}</h2>
    <p>
      {t('threads:channel.threadCount', {count: channel.threadCount})}
    </p>
    {#if channel.description}
      <p class="text-small">{channel.description}</p>
    {/if}
  </article>
</aside>
{:else}
  <p class="text-center">{t('threads:channel.error')}</p>
{/if}

<style>
  /*
   * Stopgap. The design system publishes no toolbar layout, so the header's
   * row — title block beside the search box — is local. Do not copy it.
   */
  header {
    display: flex;
    align-items: start;
    flex-wrap: wrap;
    gap: var(--cn-gap);
  }

  header > div:first-child {
    flex: 1;
    min-inline-size: 0;
  }

  .search {
    display: grid;
    row-gap: var(--cn-grid);
  }

  /* The breadcrumb trail: one line, a slash between the steps. */
  nav ol {
    list-style: none;
    display: flex;
    gap: var(--cn-grid);
    margin: 0;
    padding: 0;
  }

  nav li:not(:first-child)::before {
    content: '/';
    margin-inline-end: var(--cn-grid);
    color: var(--cn-color-text-low);
  }

  /* A grid item stretches its track; the button keeps its own width. */
  .load-more {
    justify-self: center;
  }

  /* The channel card's internal rhythm, between icon, name, count and blurb. */
  article {
    display: grid;
    row-gap: var(--cn-grid);
  }
</style>