<script lang="ts">
import { profile } from '@stores/session/profile';
import { t } from '@utils/i18n';
import { logDebug, logError } from '@utils/logHelpers';
import type { Snippet } from 'svelte';
import NickNameInput from './NickNameInput.svelte';

interface Props {
  children?: Snippet;
}

const { children }: Props = $props();

let nick = $state($profile?.nick || '');
let nickExists = $state(false);
let avatarURL = $state('');
const hasProfile = $derived.by(() => !!$profile?.nick);

const valid = $derived.by(() => {
  return !!nick && !nickExists;
});

// Get user's avatar from Firebase Auth
$effect(() => {
  getUserInfo();
});

async function getUserInfo() {
  try {
    const { auth } = await import('../../../firebase/client');
    const user = auth.currentUser;
    if (user?.photoURL) {
      avatarURL = user.photoURL;
    }
  } catch (error) {
    logError('EulaForm', 'Error getting user info', error);
  }
}

function handleNickChange(newNick: string, exists: boolean) {
  nick = newNick;
  nickExists = exists;
}

async function handleSubmit(event: Event) {
  event.preventDefault();

  if (!valid) {
    logError('EulaForm', 'Form is invalid', { nick, nickExists });
    return;
  }

  logDebug('EulaForm', 'Submitting EULA acceptance with nickname', {
    nick,
    avatarURL,
  });

  try {
    const { authedPost } = await import('../../../firebase/client/apiClient');
    const response = await authedPost('/api/onboarding/complete-eula', {
      nick,
      avatarURL,
    });

    if (response.ok) {
      logDebug('EulaForm', 'EULA accepted and profile created, redirecting');
      // Wait a bit for Firestore to propagate the new profile data
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      const errorText = await response.text();
      logError('EulaForm', 'EULA acceptance failed', {
        status: response.status,
        error: errorText,
      });
      // TODO: Show error snackbar
    }
  } catch (error) {
    logError('EulaForm', 'Error during EULA submission', error);
    // TODO: Show error snackbar
  }
}

async function handleCancel(event: Event) {
  event.preventDefault();

  logDebug('EulaForm', 'User cancelled onboarding, logging out');

  try {
    const { logout } = await import('../../../stores/session');
    await logout();
    // Redirect to home page after logout
    window.location.href = '/';
  } catch (error) {
    logError('EulaForm', 'Error during logout', error);
  }
}
</script>

<div class="content-columns">
  <div class="surface column-l">
    <h1>{t('login:eula.title')}</h1>
    <form onsubmit={handleSubmit} class="surface radius-m p-4">
      <article class="prose">
        {#if children}
          {@render children()}
        {:else}
          <p>EULA content should be provided via the children slot.</p>
        {/if}
      </article>

      <div class="elevation-1 p-2">
        {#if !hasProfile}
          <NickNameInput {nick} onNickChange={handleNickChange} />
        {:else}
          <p>{nick}</p>
          <p class="p-4">
            {t('login:eula.updateNotice.description')}
          </p>
        {/if}
      </div>

      <div class="flex justify-end gap-2 pt-4 border-t mt-4">
        <button type="button" class="cyan-button text" onclick={handleCancel}>
          {t('login:eula.decline')}
        </button>
        <button type="submit" class="cyan-button primary" disabled={!valid}>
          {t('login:eula.accept')}
        </button>
      </div>
    </form>
  </div>
</div>
