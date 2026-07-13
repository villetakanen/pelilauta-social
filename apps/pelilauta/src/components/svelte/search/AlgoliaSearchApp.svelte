<script lang="ts">
import { t } from '@utils/i18n';
import { logDebug, logError } from '@utils/logHelpers';
import { algoliasearch } from 'algoliasearch';
import SearchResult from './SearchResult.svelte';

// Get Algolia credentials from environment
const APP_ID = import.meta.env.PUBLIC_ALGOLIA_APP_ID;
const API_KEY = import.meta.env.PUBLIC_ALGOLIA_API_KEY;

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

<div class="content-columns">
  <article class="column-l surface">
    <div class="search-container">
      <div class="toolbar">
        <h1 class="text-h4 m-0 grow">{t("search:title")}</h1>
        <div>
        <img src=/Algolia-logo-blue.svg alt="Algolia Logo" class="light-only" 
            style="max-height: var(--cn-line)"/>
        <img
          src=/Algolia-logo-white.svg 
          alt="Algolia Logo" class="dark-only" 
          style="height: var(--cn-line); display: block"/>
        </div>
      </div>
      <div class="search-form">
        <div class="toolbar">
          <input
            type="text"
            bind:value={searchQuery}
            onkeydown={handleKeyDown}
            placeholder={t("search:searchPlaceholder")}
            class="search-input"
            disabled={isSearching}
          />
          <button
            onclick={handleSearch}
            disabled={isButtonDisabled}
            class="search-button"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <!-- Channel filter indicator -->
        {#if channelFilter}
          <div class="flex items-center gap-2 mt-2 p-2 bg-surface-variant radius-s">
            <cn-icon noun="filter" small></cn-icon>
            <span class="text-caption">{t('search:channel.filterActive', { channel: channelFilter })}</span>
            <button 
              onclick={() => {
                channelFilter = '';
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('channel');
                  window.history.replaceState({}, '', url.toString());
                }
              }}
              class="text-caption text-link border-none bg-transparent cursor-pointer"
              aria-label="Clear channel filter"
            >
              {t('search:channel.clearFilter')}
            </button>
          </div>
        {/if}
        
        {#if error}
          <div class="error-message">
            {error}
          </div>
        {/if}
      </div>

      {#if searchResults}
        <div class="results-container">
          <h2>{t("search:results", { count: searchResults[0].hits.length })}</h2>

          

          {#each searchResults[0].hits as hit}
            <SearchResult result={hit} />
          {/each}
        </div>
      {/if}
    </div>
  </article>
</div>

