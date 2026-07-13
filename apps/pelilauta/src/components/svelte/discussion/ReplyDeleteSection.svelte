<script lang="ts">
import { deleteReply } from 'src/firebase/client/threads/deleteReply';
import type { Reply } from 'src/schemas/ReplySchema';
import { pushSessionSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
import WithAuth from '../app/WithAuth.svelte';

interface Props {
  threadKey: string;
  reply: Reply;
}

const { threadKey, reply }: Props = $props();

const allow = $derived.by(() => {
  return reply.owners.includes($uid);
});

async function onsubmit(e: Event) {
  e.preventDefault();

  await deleteReply(threadKey, reply.key);

  // Add a Snackbar notification to confirm the deletion.
  pushSessionSnack({
    message: t('threads:snacks.replyDeleted'),
  });

  // Redirect to the forum page.
  window.location.href = `/threads/${threadKey}`;
}
</script>

<WithAuth {allow}>
  <div class="content-columns">
    <section>
      <h1 class="downscaled">{t('threads:confirmDelete.title')}</h1>
      <p>{t('threads:discussion.confirmDelete.message')}</p>

      <form class="toolbar" {onsubmit}>
        <a href={`/threads/${threadKey}`} class="button text">
          {t('actions:cancel')}
        </a>
        <button type="submit" class="button">
          {t('actions:confirm.delete')}
        </button>
      </form>

    </section>
  </div>
</WithAuth>