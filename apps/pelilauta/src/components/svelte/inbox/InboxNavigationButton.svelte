<script lang="ts">
import CnNotificationAction from '@design-system/components/CnNotificationAction.svelte';
import { t } from 'src/utils/i18n';
import { newCount } from '../../../stores/inbox';
import { isActive } from '../../../stores/session/computed';
</script>

{#if $isActive}
  <CnNotificationAction
    href="/inbox"
    noun="send"
    label={t("navigation:inbox")}
    count={$newCount}
  />
{/if}
