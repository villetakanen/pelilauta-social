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

<section class="column-s surface p-2">
  <h4 class="title is-3">
    {t('site:page.history.title')}
  </h4>
  <div class="revision-list">
    <a href="/sites/{page.siteKey}/{page.key}/history">
      {revisionCount + 1}
    </a>
    <span class="downscaled">
      {toDisplayString(page.updatedAt)}
    </span>
    <span class="downscaled text-right">
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
      <span class="downscaled">
        {toDisplayString(diff.history[rev - 1]?.createdAt)}
      </span>
      <span class="downscaled text-right">
        <ProfileLink uid={`${diff.history?.[rev - 1]?.author}`} />
      </span>
    {/each}
  </div>
</section>

<style>
.revision-list {
  display: grid;
  grid-template-columns: calc(var(--cn-grid) * 4) 1fr 1fr;
}
</style>