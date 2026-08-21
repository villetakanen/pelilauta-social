<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
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

    <CnIcon noun="send" size="small" />
    <span class="sm-hidden">{t('actions:create.thread')}</span>

  </a>
{/if}