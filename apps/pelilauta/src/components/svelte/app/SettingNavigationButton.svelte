<script lang="ts">
import CnIdentityAction from '@design-system/components/CnIdentityAction.svelte';
import { uid } from 'src/stores/session';
import { isRehydrating, isResolvedActive } from 'src/stores/session/computed';
import { profile } from 'src/stores/session/profile';
import { t } from 'src/utils/i18n';

// Set where this entry is a place of the application drawing the rail. See
// InboxNavigationButton for why a door passes nothing.
let { ariaCurrent }: { ariaCurrent?: string } = $props();
const readerProfile = $derived($profile?.key === $uid ? $profile : null);
</script>

{#if $isRehydrating}
  <!-- Firebase resolves the session on the client, so the control renders
       before there is a session to render for. Disabled, it cannot carry a
       signed-in reader to the login page in that window. -->
  <CnIdentityAction
    href="/login"
    label={t("navigation:login")}
    disabled
  />
{:else if $isResolvedActive}
  <CnIdentityAction
    href="/settings"
    label={readerProfile?.nick ?? t("navigation:settings")}
    signedIn
    nick={readerProfile?.nick}
    src={readerProfile?.avatarURL}
    aria-current={ariaCurrent}
  />
{:else}
  <CnIdentityAction href="/login" label={t("navigation:login")} />
{/if}
