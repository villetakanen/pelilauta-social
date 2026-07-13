<script lang="ts">
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
<section class="content-listing">
  <header class="flex flex-row surface">
    <div class="grow" style="flex-grow: 8;">
      <nav aria-label="Breadcrumb">
        <ol class="list-none breadcrumbs">
          <li>
            <a href="/" class="text-link">{t('app:shortname')}</a>
          </li>
          <li class="grow">
            <a href="/channels/" class="text-link">{t('threads:forum.title')}</a>
          </li>
        </ol>
      </nav>
      <h1 class="text-h3 m-0">{channel.name}</h1>
    </div>

    <!-- Channel-specific search box -->
    <div>
      <ChannelSearchBox {channel} />
    </div>
  </header>

  <div class="listing-items">
    {#each threads as thread (thread.key)}
      <ThreadListItem {thread} />
    {/each}
    
    <!-- Load more functionality -->
    {#if hasMore}
      <div class="flex items-center">
        <button 
          onclick={loadMoreThreads}
          disabled={isLoading}
          class="flex-none"
        >
          {#if isLoading}
            <cn-loader noun={channel.icon}></cn-loader>
          {:else}
            <cn-icon noun={channel.icon}></cn-icon>
          {/if}
          <span>{isLoading ? t('actions:loading') : t('actions:loadMore')}</span>
        </button>
      </div>
    {/if}

    {#if error}
      <div class="text-center p-4">
        <p class="text-error mb-2">{error}</p>
        <button 
          onclick={loadMoreThreads} 
          class="px-2 py-1 bg-transparent text-primary border border-primary radius-s cursor-pointer text-caption"
        >
          <cn-icon noun={channel.icon}></cn-icon>
          <span>{t('actions:retry')}</span>
        </button>
      </div>
    {/if}
  </div>

  <aside>
    <article class="border surface">
      <cn-icon noun={channel.icon} large></cn-icon>
      <h2 class="downscaled m-0 full-width">{channel.name}</h2>
      <p class="my-0 full-width">
        {t('threads:channel.threadCount', {count: channel.threadCount})}
      </p>
      {#if channel.description}
        <p class="text-small">{channel.description}</p>
      {/if}
    </article>
  </aside>
</section>
{:else}
  <div class="flex justify-center items-center p-8">
    <p class="text-error">{t('threads:channel.error')}</p>
  </div>
{/if}