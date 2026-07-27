<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
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
    <Icon noun="send" />
    <span class="sm-hidden">{t('actions:create.thread')}</span>
  </a>
{:else}
  <a href="/login" class="fab button">
    <Icon noun="avatar" />
    <span class="sm-hidden">{t('actions:login')}</span>
  </a>
{/if}
