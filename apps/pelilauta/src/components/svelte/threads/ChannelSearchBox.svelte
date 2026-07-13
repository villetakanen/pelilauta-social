<script lang="ts">
import type { Channel } from '@schemas/ChannelSchema';
import { uid } from '@stores/session';
import { t } from '@utils/i18n';

interface Props {
  channel: Channel;
}

const { channel }: Props = $props();

let searchQuery = $state('');
let isAuthenticated = $derived(!!$uid);

function handleSearch(event: Event) {
  event.preventDefault();

  if (!isAuthenticated) {
    // Redirect to login page with current location as redirect
    if (typeof window !== 'undefined') {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
    return;
  }

  if (!searchQuery.trim()) {
    return;
  }

  // Redirect to search page with channel filter and query
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams({
      q: searchQuery.trim(),
      channel: channel.slug,
    });

    window.location.href = `/search?${searchParams.toString()}`;
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleSearch(event);
  }
}

function getRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '/';
}
</script>

<form onsubmit={handleSearch} class="flex border radius-m px-2 items-center">
  <input
    type="text"
    bind:value={searchQuery}
    onkeypress={handleKeyPress}
    placeholder={isAuthenticated 
      ? t('search:channel.placeholder', { channel: channel.name })
      : t('search:channel.loginRequired')}
    disabled={!isAuthenticated}
    class="flex-1 border-none bg-transparent text-body p-2 disabled:opacity-60 disabled:cursor-not-allowed"
    class:disabled={!isAuthenticated}
  />
  <button 
    type="submit"
    disabled={!isAuthenticated || !searchQuery.trim()}
    aria-label={isAuthenticated ? 'Search' : 'Sign in to search'}
  >
    <cn-icon noun="search" small></cn-icon>
  </button>
</form>

{#if !isAuthenticated}
  <div class="text-caption text-secondary mt-1 flex items-center gap-1">
    <cn-icon noun="info" small></cn-icon>
    <span>
      <a href="/login?redirect={encodeURIComponent(getRedirectUrl())}" class="text-link">
        {t('login:title')}
      </a> {t('search:channel.loginPrompt')}
    </span>
  </div>
{/if}