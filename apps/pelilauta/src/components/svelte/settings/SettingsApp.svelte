<script lang="ts">
import CnLoader from '@design-system/components/CnLoader.svelte';
import { uid } from '@stores/session';
import {
  profile,
  profileMissing,
  subscribeToProfile,
} from '@stores/session/profile';
import { t } from 'src/utils/i18n';
import { onMount } from 'svelte';
import ProfileSection from '../../shared/ProfileSection.svelte';
import Actions from './Actions.svelte';
import AuthnSection from './AuthnSection.svelte';
import ProfileTool from './ProfileTool.svelte';
import RemoveAccountSection from './RemoveAccountSection.svelte';

onMount(() => {
  if ($uid) {
    subscribeToProfile($uid);
  }
});
</script>

{#if $profile}
  <ProfileSection profile={$profile} />
  <ProfileTool />
  <Actions />
  <AuthnSection />
  <RemoveAccountSection />
{:else if $profileMissing}
  <div class="surface">
    <p>
      {t('settings:missingProfile.title')}
    </p>
    <p class="text-low">
      {t('settings:missingProfile.info')}
    </p>
    <div>
      <a href="/onboarding" class="button">
        {t('settings:missingProfile.action')}
      </a>
    </div>
  </div>
{:else}
  <div>
    <CnLoader />
  </div>
{/if}

<style>
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>
