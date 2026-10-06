<script lang="ts">
import CnNotificationAction from '@design-system/components/CnNotificationAction.svelte';
import { newCount } from '@pelilauta/library/client/inbox/inboxStore';
import { isActive } from '@pelilauta/stores/session/computed';
import { t } from 'src/utils/i18n';

// Set where this entry is a place of the application drawing the rail. A rail
// whose entry leads out of its own application passes nothing: a reader who
// followed it is no longer looking at that rail.
let { ariaCurrent }: { ariaCurrent?: string } = $props();
</script>

{#if $isActive}
  <CnNotificationAction
    href="/inbox"
    noun="send"
    label={t("navigation:inbox")}
    count={$newCount}
    aria-current={ariaCurrent}
  />
{/if}
