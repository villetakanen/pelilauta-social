<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
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

<form onsubmit={handleSearch}>
  <input
    type="text"
    bind:value={searchQuery}
    onkeypress={handleKeyPress}
    placeholder={isAuthenticated
      ? t('search:channel.placeholder', { channel: channel.name })
      : t('search:channel.loginRequired')}
    disabled={!isAuthenticated}
  />
  <button
    type="submit"
    disabled={!isAuthenticated || !searchQuery.trim()}
    aria-label={isAuthenticated ? 'Search' : 'Sign in to search'}
  >
    <CnIcon noun="search" size="small" />
  </button>
</form>

{#if !isAuthenticated}
  <p class="text-caption text-low">
    <CnIcon noun="info" size="small" />
    <span>
      <a href="/login?redirect={encodeURIComponent(getRedirectUrl())}">
        {t('login:title')}
      </a> {t('search:channel.loginPrompt')}
    </span>
  </p>
{/if}

<style>
  /* The input takes the row; the icon button keeps its square. */
  form {
    display: flex;
    align-items: center;
    gap: var(--cn-grid);
  }

  input {
    flex: 1;
    min-inline-size: 0;
  }

  p {
    display: flex;
    align-items: center;
    gap: var(--cn-grid);
  }
</style>