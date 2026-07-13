<script lang="ts">
import { profile, profileMissing } from '@stores/session/profile';
import ProfileSection from '../../shared/ProfileSection.svelte';
import Actions from './Actions.svelte';
import AuthnSection from './AuthnSection.svelte';
import ProfileTool from './ProfileTool.svelte';
import RemoveAccountSection from './RemoveAccountSection.svelte';
</script>

<div class="content-columns">
  {#if $profile}
    <ProfileSection profile={$profile} />
    <ProfileTool />
    <Actions />
    <AuthnSection />
    <RemoveAccountSection />
  {:else if $profileMissing}
    <div class="p-2">
      <p class="text-error">
        Profile not found. Please try logging out and back in.
      </p>
      <p class="text-low">
        If the issue persists, your profile data might be corrupted.
      </p>
      <div class="toolbar">
        <a href="/onboarding" class="button cyan-button primary">
          Repair Profile
        </a>
      </div>
    </div>
  {:else}
    <div>
      <cn-loader></cn-loader>
    </div>
  {/if}
</div>
