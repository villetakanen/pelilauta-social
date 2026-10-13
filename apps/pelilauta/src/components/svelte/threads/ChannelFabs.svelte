<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { t } from 'src/utils/i18n';
import { isActive } from '../../../stores/session/computed';

interface Props {
  channel: string;
}
const { channel }: Props = $props();
</script>
{#if $isActive}
  <a href={`/create/thread?channel=${channel}`} class="fab">
    <CnIcon noun="send" />
    <span>{t('actions:create.thread')}</span>
  </a>
{:else}
  <a href="/login" class="fab">
    <CnIcon noun="avatar" />
    <span>{t('actions:login')}</span>
  </a>
{/if}
