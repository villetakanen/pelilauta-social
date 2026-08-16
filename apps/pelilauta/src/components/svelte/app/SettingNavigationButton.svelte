<script lang="ts">
import CnIdentityAction from '@design-system/components/CnIdentityAction.svelte';
import { isActive, isRehydrating } from 'src/stores/session/computed';
import { profile } from 'src/stores/session/profile';
import { t } from 'src/utils/i18n';
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
{:else if $isActive}
  <CnIdentityAction
    href="/settings"
    label={$profile?.nick ?? t("navigation:settings")}
    signedIn
    nick={$profile?.nick}
    src={$profile?.avatarURL}
  />
{:else}
  <CnIdentityAction href="/login" label={t("navigation:login")} />
{/if}
