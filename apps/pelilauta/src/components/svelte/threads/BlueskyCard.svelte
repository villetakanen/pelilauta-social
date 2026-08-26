<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import type { Thread } from '@schemas/ThreadSchema';
import { uid } from '@stores/session';
import { pushSnack } from '@utils/client/snackUtils';
import { t } from '@utils/i18n';
import { logDebug, logError } from '@utils/logHelpers';
import { syndicateToBsky } from '../thread-editor/submitThreadUpdate';

interface Props {
  thread: Thread;
  isAuthorOrAdmin: boolean;
  bskyFeatureEnabled: boolean;
}

const { thread, isAuthorOrAdmin, bskyFeatureEnabled }: Props = $props();

let isSharing = $state(false);

async function handleShare() {
  if (!$uid || isSharing) return;

  isSharing = true;

  try {
    logDebug('BlueskyCard', 'Starting syndication for thread:', thread.key);

    const result = await syndicateToBsky(thread, $uid);

    if (result.success && result.blueskyPostUrl) {
      logDebug('BlueskyCard', 'Syndication successful:', result.blueskyPostUrl);

      // Show success message, then refresh page to show embed
      pushSnack(t('threads:share.success'));

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      const errorMsg = result.error || 'Unknown error occurred';
      logError('BlueskyCard', 'Syndication failed:', errorMsg);
      pushSnack(t('threads:share.error', { severity: 'warning' }));
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : 'Failed to share to Bluesky';
    logError('BlueskyCard', 'Exception during syndication:', error);
    pushSnack(t('threads:share.error', { severity: 'warning' }));
  } finally {
    isSharing = false;
  }
}
</script>

<!--
  A prompt for one action, not a preview of a subject, so it is neither a CnCard
  nor a listing row: it takes the idiom every other box in the thread info column
  takes, including the Bluesky embed that replaces it in this slot.
-->
{#if bskyFeatureEnabled && isAuthorOrAdmin}
  <section class="surface">
    <h2>
      <CnIcon noun="share" size="small" decorative />
      {t("threads:info.blueskyTitle")}
    </h2>
    <p class="text-caption">
      {t("threads:share.description")}
    </p>

    <button onclick={handleShare} disabled={isSharing}>
      <CnIcon noun="share" />
      <span>
        {isSharing ? t("threads:share.sharing") : t("threads:share.button")}
      </span>
    </button>
  </section>
{/if}

<style>
  /*
   * This section is a surface box in the thread info column; the column states
   * only the interval between boxes, so the rhythm between the heading, the
   * prompt and the button is stated here.
   */
  section {
    display: grid;
    row-gap: var(--cn-line);
  }

  /*
   * The heading carries its icon on the same line as its text.
   */
  h2 {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }
</style>
