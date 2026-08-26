<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { t } from '@utils/i18n';
import { logDebug, logError } from '@utils/logHelpers';
import { algoliasearch } from 'algoliasearch';
import SearchResult from './SearchResult.svelte';

// Get Algolia credentials from environment
const APP_ID = import.meta.env.PUBLIC_ALGOLIA_APP_ID;
const API_KEY = import.meta.env.PUBLIC_ALGOLIA_API_KEY;

/*
 * The document's scheme, not the OS's: the account's stored theme forces the
 * root's colorScheme, and the logo has to follow the page it stands on. The
 * root wins where it is set; the OS preference answers where it is not.
 */
const resolveScheme = () => {
  if (typeof document === 'undefined') return 'dark';
  const forced = document.documentElement.style.colorScheme;
  if (forced === 'light' || forced === 'dark') return forced;
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
};
let scheme = $state(resolveScheme());
$effect(() => {
  const update = () => {
    scheme = resolveScheme();
  };
  const preference = window.matchMedia('(prefers-color-scheme: light)');
  window.addEventListener('cn-theme-change', update);
  preference.addEventListener('change', update);
  update();
  return () => {
    window.removeEventListener('cn-theme-change', update);
    preference.removeEventListener('change', update);
  };
});

// Initialize Algolia client
const client = algoliasearch(APP_ID, API_KEY);

// Type definitions for search results
interface SearchHit {
  objectID: string;
  title: string;
  markdownContent: string;
  type: string;
  author: string;
  path: string;
}

interface SearchResultData {
  hits: SearchHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  exhaustiveNbHits: boolean;
  exhaustiveTypo: boolean;
  query: string;
  params: string;
  processingTimeMS: number;
}

// Component state
let searchQuery = $state('');
let channelFilter = $state('');
let searchResults = $state<SearchResultData[] | null>(null);
let isSearching = $state(false);
let error = $state<string | null>(null);

// Initialize from URL parameters
$effect(() => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    const channel = urlParams.get('channel');

    if (q) {
      searchQuery = q;
    }
    if (channel) {
      channelFilter = channel;
    }

    // Auto-search if query parameter is present
    if (q) {
      handleSearch();
    }
  }
});

// Debug derived state
const isButtonDisabled = $derived(isSearching || !searchQuery.trim());

async function handleSearch() {
  if (!searchQuery.trim()) {
    error = 'Please enter a search query';
    return;
  }

  isSearching = true;
  error = null;
  searchResults = null;

  try {
    logDebug(
      'AlgoliaSearchApp',
      'Starting search for:',
      searchQuery,
      'channel:',
      channelFilter,
    );

    // Build search request with optional channel filter
    interface SearchRequest {
      indexName: string;
      query: string;
      facetFilters?: string[][];
    }

    const searchRequest: SearchRequest = {
      indexName: 'pelilauta-entries',
      query: searchQuery,
    };

    // Add facetFilters if channel is specified
    if (channelFilter) {
      searchRequest.facetFilters = [[`channel:${channelFilter}`]];
      logDebug(
        'AlgoliaSearchApp',
        'Applied facetFilters:',
        searchRequest.facetFilters,
      );
    }

    logDebug(
      'AlgoliaSearchApp',
      'Search request:',
      JSON.stringify(searchRequest, null, 2),
    );

    // Perform search
    const { results } = await client.search({
      requests: [searchRequest],
    });

    searchResults = results as SearchResultData[];
    logDebug(
      'AlgoliaSearchApp',
      'Search completed, results:',
      JSON.stringify(results, null, 2),
    );

    // If we got results, log the first hit to see its structure
    const firstResult = results[0] as SearchResultData;
    if (firstResult?.hits?.length > 0) {
      logDebug(
        'AlgoliaSearchApp',
        'First hit structure:',
        JSON.stringify(firstResult.hits[0], null, 2),
      );
    } else {
      logDebug(
        'AlgoliaSearchApp',
        'No hits returned. Try without channel filter to verify base search works.',
      );
    }
  } catch (err) {
    logError('AlgoliaSearchApp', 'Search failed:', err);
    error = err instanceof Error ? err.message : 'Search failed';
  } finally {
    isSearching = false;
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleSearch();
  }
}
</script>

<article class="surface">
  <header class="search-header">
    <h2>{t('search:title')}</h2>
    <div>
      <img
        src={scheme === 'dark'
          ? '/Algolia-logo-white.svg'
          : '/Algolia-logo-blue.svg'}
        alt="Algolia Logo"
        style="height: var(--cn-line); display: block"
      />
    </div>
  </header>

  <form
    class="search-form"
    onsubmit={(event) => {
      event.preventDefault();
      handleSearch();
    }}
  >
    <div class="search-controls">
      <input
        type="text"
        bind:value={searchQuery}
        onkeydown={handleKeyDown}
        placeholder={t('search:searchPlaceholder')}
        disabled={isSearching}
      />
      <button
        type="submit"
        disabled={isButtonDisabled}
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>
    </div>

    <!-- Channel filter indicator -->
    {#if channelFilter}
      <div class="channel-filter">
        <CnIcon noun="filter" size="small" />
        <span class="filter-label">{t('search:channel.filterActive', { channel: channelFilter })}</span>
        <button
          type="button"
          onclick={() => {
            channelFilter = '';
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('channel');
              window.history.replaceState({}, '', url.toString());
            }
          }}
          class="clear-filter"
          aria-label="Clear channel filter"
        >
          {t('search:channel.clearFilter')}
        </button>
      </div>
    {/if}

    {#if error}
      <div class="surface error">
        {error}
      </div>
    {/if}
  </form>

  {#if searchResults}
    <section class="results-container">
      <h3>{t('search:results', { count: searchResults[0].hits.length })}</h3>

      <div class="results-list">
        {#each searchResults[0].hits as hit}
          <SearchResult result={hit} />
        {/each}
      </div>
    </section>
  {/if}
</article>

<style>
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }

  .search-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--cn-gap);
  }

  .search-form {
    display: grid;
    row-gap: var(--cn-gap);
  }

  .search-controls {
    display: flex;
    align-items: center;
    gap: var(--cn-grid);
  }

  .search-controls input {
    flex: 1;
    min-inline-size: 0;
  }

  .channel-filter {
    display: flex;
    align-items: center;
    gap: var(--cn-grid);
    padding: calc(var(--cn-grid) * 0.5) var(--cn-gap);
    background-color: var(--cn-color-surface-2);
    border-radius: var(--cn-border-radius);
    font-size: var(--cn-font-size-caption);
    line-height: var(--cn-line-height-caption);
  }

  .filter-label {
    flex: 1;
  }

  .clear-filter {
    background: none;
    background-image: none;
    border: none;
    box-shadow: none;
    padding: 0;
    margin: 0;
    block-size: auto;
    min-block-size: auto;
    min-inline-size: auto;
    color: var(--cn-color-link);
    font-family: inherit;
    font-size: var(--cn-font-size-caption);
    font-weight: var(--cn-font-weight-caption);
    line-height: var(--cn-line-height-caption);
    text-decoration: underline;
    text-underline-offset: 0.18em;
    cursor: pointer;
  }

  .clear-filter::before,
  .clear-filter::after {
    display: none;
  }

  .clear-filter:hover {
    color: var(--cn-color-link-hover);
    box-shadow: none;
  }

  .results-container {
    display: grid;
    row-gap: var(--cn-gap);
  }

  .results-list {
    display: grid;
    row-gap: var(--cn-gap);
  }
</style>

