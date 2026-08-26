<script lang="ts">
// Import stores and utilities

import CnAvatar from '@design-system/components/CnAvatar.svelte';
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import { authUser, uid } from 'src/stores/session'; // Use centralized session stores
import { profile } from 'src/stores/session/profile'; // $profile is used directly as per nanostores/svelte
import { pushSessionSnack } from 'src/utils/client/snackUtils'; // For user feedback
import { t } from 'src/utils/i18n';

// No props needed for this component
// interface Props {}
// const {}: Props = $props();

// Component state using Svelte runes - using session stores instead of local state
let avatarURL = $state<string | null>(null);
let loadingAvatarUpdate = $state(false); // For UX feedback during avatar update

// Derived values from session stores
const email = $derived.by(() => $authUser?.email || null);
const displayName = $derived.by(() => $authUser?.displayName || null);

// Initialize avatarURL from auth user when available
$effect(() => {
  if ($authUser?.photoURL && avatarURL !== $authUser.photoURL) {
    avatarURL = $authUser.photoURL;
  }
});

/**
 * Updates the user's avatar URL in their profile.
 * Dynamically imports the updateProfile function.
 */
async function updateAvatar() {
  if (!avatarURL || !$profile?.key) {
    pushSessionSnack(t('settings:authz.error.missingInfo'), { type: 'error' });
    return;
  }
  loadingAvatarUpdate = true;
  try {
    // Dynamically import Firebase profile update function
    const { updateProfile } = await import(
      'src/firebase/client/profile/updateProfile'
    );
    await updateProfile({ avatarURL: avatarURL }, $profile.key);
    pushSessionSnack(t('settings:authz.updateAvatarSuccess'));
    // Optionally, re-fetch profile or rely on store subscription if $profile updates automatically
  } catch (error) {
    console.error('Error updating avatar:', error);
    pushSessionSnack(t('settings:authz.error.updateFailed'), { type: 'error' });
  } finally {
    loadingAvatarUpdate = false;
  }
}
</script>
  
<section class="surface">
  <h3>{t('settings:authz.title')}</h3>
  <p class="text-small text-low">{t('settings:authz.info')}</p>

  <div class="field-grid">
    <div class="field-row">
      <span class="text-label">{t('settings:authz.fields.uid')}</span>
      <span class="text-small text-low">{$uid || '---'}</span>
    </div>

    <div class="field-row">
      <span class="text-label">{t('settings:authz.fields.displayName')}</span>
      <span class="text-small text-low">{displayName || '---'}</span>
    </div>

    <div class="field-row">
      <span class="text-label">{t('settings:authz.fields.email')}</span>
      <span class="text-small text-low">{email || '---'}</span>
    </div>

    <div class="field-row">
      <span class="text-label">{t('settings:authz.fields.avatarURL')}</span>
      <div>
        <span class="text-small text-low avatar-url">{avatarURL || '---'}</span>
        {#if avatarURL && avatarURL !== $profile?.avatarURL}
          <div class="avatar-migration">
            <CnAvatar src={$profile?.avatarURL} aria-hidden />
            <span class="icon-separator"><CnIcon noun="add" /></span>
            <CnAvatar src={avatarURL} aria-hidden />
          </div>
          <button
            type="button"
            class="button"
            disabled={!avatarURL || avatarURL === $profile?.avatarURL || loadingAvatarUpdate}
            onclick={updateAvatar}
          >
            {#if loadingAvatarUpdate}
              <CnLoader inline />
            {:else}
              <CnIcon noun="avatar" />
            {/if}
            <span>{t('settings:authz.updateAvatar')}</span>
          </button>
        {/if}
      </div>
    </div>
  </div>

  <p class="text-small text-low">
    <a href="/docs/04-authz">{t('actions:learnMore')}</a>
  </p>
</section>

<style>
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }

  .field-grid {
    display: grid;
    row-gap: var(--cn-gap);
  }

  .field-row {
    display: flex;
    flex-direction: column;
    gap: calc(var(--cn-grid) * 0.25);
  }

  .avatar-url {
    word-break: break-all;
  }

  .avatar-migration {
    display: flex;
    align-items: center;
    gap: var(--cn-grid);
    margin-block: var(--cn-grid);
  }

  .icon-separator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
</style>
  