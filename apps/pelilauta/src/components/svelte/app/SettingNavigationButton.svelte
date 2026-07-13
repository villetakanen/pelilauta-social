<script lang="ts">
import { isActive, isRehydrating } from 'src/stores/session/computed';
import { profile } from 'src/stores/session/profile';
import { t } from 'src/utils/i18n';
</script>

{#if $isRehydrating}
  <div class="p-1">
    <cn-loader small></cn-loader>
  </div>
{:else if $isActive}
  <!-- Using isActive ensures we only show the authenticated UI when the session is fully verified -->
  <a
    href="/settings"
    aria-label={$profile?.nick}
    data-testid="setting-navigation-button"
  >
    <cn-navigation-icon noun="avatar" label={$profile?.nick}
    ></cn-navigation-icon>
  </a>
{:else}
  <a href="/login" aria-label={t("navigation:login")}>
    <cn-navigation-icon noun="login" label={t("navigation:login")}
    ></cn-navigation-icon>
  </a>
{/if}
