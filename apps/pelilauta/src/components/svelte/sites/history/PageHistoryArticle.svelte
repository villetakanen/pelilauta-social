<script lang="ts">
import { applyPatch, type Change, diffLines } from 'diff';
import type { PageHistory } from 'src/schemas/PageHistorySchema';
import type { Page } from 'src/schemas/PageSchema';
import { toDisplayString, toTimeString } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import { logDebug } from 'src/utils/logHelpers';
import { uid } from '../../../../stores/session';
import AvatarLink from '../../app/AvatarLink.svelte';
import ProfileLink from '../../app/ProfileLink.svelte';

interface Props {
  page: Page;
  diff: PageHistory;
  // The revision number to display (e.g., 1 is the most recent change, 0 is the current version)
  revision: number;
}
const { page, revision, diff }: Props = $props();

// --- Component State ---
let isLoading = $state(true);
let error = $state<string | null>(null);
let diffParts = $state<Change[]>([]);
let revisionDetails = $state<{ author: string; createdAt: number } | null>(
  null,
);

$effect(() => {
  async function loadAndDiff() {
    logDebug(
      'PageHistoryArticle',
      'Loading history for page',
      page.key,
      'revision',
      revision,
    );
    isLoading = true;
    error = null;
    diffParts = [];
    revisionDetails = null;

    if (!page?.key) {
      error = t('site:page.history.errors.missing_key');
      isLoading = false;
      return;
    }

    try {
      const historyArray = diff.history;
      const revisionCount = diff.history.length;

      if (revision > revisionCount || revision < 1) {
        // This case handles when the revision number is invalid or points
        // to the "current" version, which has no diff to show against itself.
        isLoading = false;
        return;
      }

      // 2. Reconstruct the historical state by applying patches sequentially.
      let reconstructedOldContent = page.markdownContent ?? '';
      const startIndex = revisionCount - 1; // Index of newest revision
      const endIndex = revisionCount - revision; // Index of the target revision

      // Loop from the most recent change back to the one we are targeting.
      for (let i = startIndex; i >= endIndex; i--) {
        const loopRevision = historyArray[i];
        if (!loopRevision?.change) {
          throw new Error(
            t('site:page.history.errors.invalid_revision_at', { index: i }),
          );
        }

        const result = applyPatch(reconstructedOldContent, loopRevision.change);

        if (result === false) {
          throw new Error(
            t('site:page.history.errors.patch_failed_at', { index: i }),
          );
        }
        reconstructedOldContent = result;
      }

      // 3. Get details from the target revision for the header
      const selectedRevision = historyArray[endIndex];
      if (!selectedRevision) {
        throw new Error(t('site:page.history.errors.invalid_revision'));
      }
      revisionDetails = {
        author: selectedRevision.author,
        createdAt: selectedRevision.createdAt,
      };

      // 4. Calculate the final diff between the fully reconstructed old
      // content and the current live content.
      diffParts = diffLines(
        reconstructedOldContent,
        page.markdownContent ?? '',
      );
    } catch (e) {
      error = e instanceof Error ? e.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  }

  loadAndDiff();
});
</script>

<section class="column-l">
  <header class="surface mb-1 p-2">
    <span>{t('site:page.history.revision', { index: revision })}</span>
    {#if revisionDetails}
      : <ProfileLink uid={revisionDetails.author} />
      {t('site:page.history.createdAt', {  date: toTimeString(revisionDetails.createdAt) })}
    {/if}
  </header>

  <article class="surface p-2" style="overflow: auto;">
    {#if isLoading}
      <p>{t('site:page.history.loading')}</p>
    {:else if error}
      <p class="error">{error}</p>
    {:else if diffParts.length === 0}
      <p>{t('site:page.history.current_version')}</p>
    {:else}
      <div class="diff">
        {#each diffParts as part}
          <div class:diff-added={part.added} class:diff-deletion={part.removed} class="flex flex-no-wrap">
            {#if part.added}<span class="diff-indicator p-1">+</span>{/if}{#if part.removed}<span class="diff-indicator p-1">-</span>{/if}{part.value}
          </div>
        {/each}
      </div>
    {/if}
  </article>
</section>

<style>

.diff-indicator {
  flex: none;
  width: var(--cn-line);
  align-items: flex-start;
}
</style>
