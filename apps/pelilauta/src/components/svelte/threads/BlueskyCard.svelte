<script lang="ts">
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

{#if bskyFeatureEnabled && isAuthorOrAdmin}
  <cn-card title={t("threads:info.blueskyTitle")} noun="share" class="mt-2">
    <p class="text-caption mb-2">
      {t("threads:share.description")}
    </p>

    <div class="toolbar items-center">
      <button onclick={handleShare} disabled={isSharing}>
        <cn-icon noun="share"></cn-icon>
        <span>
          {isSharing ? t("threads:share.sharing") : t("threads:share.button")}
        </span>
      </button>
    </div>
  </cn-card>
{/if}
