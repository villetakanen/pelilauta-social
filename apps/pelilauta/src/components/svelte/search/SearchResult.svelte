<script lang="ts">
import { t } from '@utils/i18n';
import { createPlainSnippet } from '@utils/snippetHelpers';
import ProfileLink from '../app/ProfileLink.svelte';

interface Props {
  result: {
    title: string;
    markdownContent: string;
    type: string;
    author: string;
    path: string;
  };
}
const { result }: Props = $props();
const url = `/threads/${result.path.split('/').pop()}`;
const snippet = createPlainSnippet(result.markdownContent || '', 150);
</script>

<article class="search-result">
  <h4>
    <a href={url}>
      {result.title}
    </a>
  </h4>
  <div class="result-author">
    <ProfileLink uid={result.author} />
  </div>
  <p class="result-snippet">{snippet}</p>
  <div>
    <a href={url} class="read-more">{t('actions:readMore')}</a>
  </div>
</article>

<style>
  .search-result {
    display: grid;
    row-gap: calc(var(--cn-grid) * 0.5);
    padding-block-start: var(--cn-gap);
    border-block-start: 1px solid var(--cn-color-border);
  }

  .search-result:first-child {
    border-block-start: none;
    padding-block-start: 0;
  }

  .result-author {
    font-size: var(--cn-font-size-caption);
    line-height: var(--cn-line-height-caption);
  }

  .result-snippet {
    font-size: var(--cn-font-size-small);
    line-height: var(--cn-line-height-small);
    color: var(--cn-color-text-low);
  }

  .read-more {
    font-size: var(--cn-font-size-small);
  }
</style>
