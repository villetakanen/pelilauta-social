<script lang="ts">
import type { PageHistory } from 'src/schemas/PageHistorySchema';
import type { Page } from 'src/schemas/PageSchema';
import { toDisplayString } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import ProfileLink from '../../app/ProfileLink.svelte';

interface Props {
  page: Page;
  diff: PageHistory;
  revision: number;
}
const { page, revision, diff }: Props = $props();
const revisionCount = diff.history.length || 0;
</script>

<section class="surface">
  <h4>
    {t('site:page.history.title')}
  </h4>
  <div class="revision-list">
    <a href="/sites/{page.siteKey}/{page.key}/history">
      {revisionCount + 1}
    </a>
    <span>
      {toDisplayString(page.updatedAt)}
    </span>
    <span>
      <ProfileLink uid={`${page.owners[0]}`} />
    </span>
    {#each Array(revisionCount) as _, i}
      {@const rev = revisionCount - i}
      {#if rev === revision}
        <span class="current">
          {rev}
        </span>
      {:else}
        <a href="/sites/{page.siteKey}/{page.key}/history?revision={rev}">
          {rev} 
        </a>
      {/if}
      <span>
        {toDisplayString(diff.history[rev - 1]?.createdAt)}
      </span>
      <span>
        <ProfileLink uid={`${diff.history?.[rev - 1]?.author}`} />
      </span>
    {/each}
  </div>
</section>

<style>
/*
 * The Golden container places this section and reaches no deeper, so the interval
 * between the heading and the revision list is stated here.
 */
.surface {
  display: grid;
  row-gap: var(--cn-line);
}

.revision-list {
  display: grid;
  grid-template-columns: calc(var(--cn-grid) * 4) 1fr 1fr;
  row-gap: var(--cn-gap);
  column-gap: var(--cn-gap);
  align-items: center;
}
</style>