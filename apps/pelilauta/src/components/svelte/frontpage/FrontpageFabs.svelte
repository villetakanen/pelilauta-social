<script lang="ts">
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';

const visible = $derived.by(() => {
  return !!$uid;
});
</script>

{#if visible}
  <a
    href="/create/thread"
    class="button fab"
    aria-label={t('actions:create.thread')}
    data-testid="createDiscussionFab">

    <cn-icon noun="send" small></cn-icon>
    <span class="sm-hidden">{t('actions:create.thread')}</span>

  </a>
{/if}