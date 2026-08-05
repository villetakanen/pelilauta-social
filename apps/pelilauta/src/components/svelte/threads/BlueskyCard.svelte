<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
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
  A prompt for one action, not a preview of a subject, so it is neither a CnCard nor a
  Surface: it takes the thread info column's own idiom — a border-separated section with
  a downscaled heading — which is what ThreadInfoActions below it and the Bluesky embed
  that replaces it in this slot both render.
-->
{#if bskyFeatureEnabled && isAuthorOrAdmin}
  <section class="flex flex-col border-t p-2 mt-2">
    <h4 class="downscaled m-0">{t("threads:info.blueskyTitle")}</h4>
    <p class="text-caption mb-1">
      {t("threads:share.description")}
    </p>

    <button onclick={handleShare} disabled={isSharing}>
      <Icon noun="share" />
      <span>
        {isSharing ? t("threads:share.sharing") : t("threads:share.button")}
      </span>
    </button>
  </section>
{/if}
