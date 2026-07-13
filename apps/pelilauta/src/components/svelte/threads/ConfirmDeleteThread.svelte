<script lang="ts">
import { appMeta } from '@stores/metaStore/metaStore';
import { deleteThread } from 'src/firebase/client/threads/deleteThread';
import type { Thread } from 'src/schemas/ThreadSchema';
import { pushSessionSnack, pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import { uid } from '../../../stores/session';
import WithAuth from '../app/WithAuth.svelte';

interface Props {
  thread: Thread;
}

const { thread }: Props = $props();

const allow = $derived.by(() => {
  if ($appMeta.admins.includes($uid)) {
    return true;
  }
  if (!$uid) {
    return false;
  }
  return thread.owners.includes($uid);
});

async function onsubmit(e: Event) {
  e.preventDefault();
  try {
    await deleteThread(thread);
    // Add a Snackbar notification to confirm the deletion.
    pushSessionSnack({
      message: t('threads:confirmDelete.success'),
    });

    // Redirect to the forum page.
    window.location.href = '/';
  } catch (e: unknown) {
    if (e instanceof Error) {
      logError('ConfirmDeleteThread', 'Failed to delete thread:', e);
      pushSnack({
        message: t('threads:confirmDelete.error'),
      });
    } else {
      logError(
        'ConfirmDeleteThread',
        'Unknown error occurred during thread deletion',
      );
      pushSnack({
        message: t('threads:confirmDelete.error'),
      });
    }
  }
}
</script>
<WithAuth {allow}>
  <div class="content-columns">

    <section>
    
      <h1 class="downscaled">{t('threads:confirmDelete.title')}</h1>
      
      <p>{t('threads:confirmDelete.message')}</p>
    
      <form class="toolbar" {onsubmit}>
        <a href={`/threads/${thread.key}`} class="button text">
          {t('actions:cancel')}
        </a>
        <button type="submit" class="button">
          {t('actions:confirm.delete')}
        </button>
      </form>

    </section>
  </div>
</WithAuth>
 
