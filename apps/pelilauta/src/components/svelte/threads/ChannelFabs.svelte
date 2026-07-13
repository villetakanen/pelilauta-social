<script lang="ts">
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';

interface Props {
  channel: string;
}
const { channel }: Props = $props();

const visible = $derived.by(() => {
  return !!$uid;
});
</script>
{#if visible}
  <a href={`/create/thread?channel=${channel}`} class="fab">
    <cn-icon noun="send"></cn-icon>
    <span class="sm-hidden">{t('actions:create.thread')}</span>
  </a>
{:else}
  <a href="/login" class="fab button">
    <cn-icon noun="avatar"></cn-icon>
    <span class="sm-hidden">{t('actions:login')}</span>
  </a>
{/if}
