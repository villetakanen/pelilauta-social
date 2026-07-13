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

<div class="search-result mb-2 border-t">
  <h3 class="text-h5 m-0">
    <a href={url} class="no-underline hover-underline">
      {result.title}
    </a>
  </h3>
  <p><ProfileLink uid={result.author} /></p>
  <p class="text-small">{snippet}</p>
  <a href={url} class="read-more">{t("actions:readMore")}</a>
</div>
