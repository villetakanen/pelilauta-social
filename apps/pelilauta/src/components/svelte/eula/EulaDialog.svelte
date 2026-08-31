<script lang="ts">
import { createAccount } from 'src/firebase/client/account/createAccount';
import { updateAccount } from 'src/firebase/client/account/updateAccount';
import { createProfile } from 'src/firebase/client/profile/createProfile';
import type { Account } from 'src/schemas/AccountSchema';
import type { Profile } from 'src/schemas/ProfileSchema';
import { requiresEula } from 'src/stores/session/account';
import { profile } from 'src/stores/session/profile';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logError, logWarn } from 'src/utils/logHelpers';
import { toMekanismiURI } from 'src/utils/mekanismiUtils';
import { onMount, type Snippet } from 'svelte';
import { uid } from '../../../stores/session';
import NickNameInput from './NickNameInput.svelte';

interface Props {
  children?: Snippet;
}
const { children }: Props = $props();
let dialog: HTMLDialogElement | undefined = $state();
let nick = $state('');
let avatarUrl = $state('');
let nickExists = $state(false);

const valid = $derived.by(() => {
  if ($profile?.nick) return true;
  return !!nick && !nickExists;
});

onMount(() => {
  getUserInfo();
});

$effect(() => {
  if ($requiresEula && dialog && !dialog.open) {
    dialog.showModal();
  } else if (!$requiresEula && dialog && dialog.open) {
    dialog.close();
  }
});

async function getUserInfo() {
  const { auth } = await import('../../../firebase/client');
  const user = auth.currentUser;
  if (!user) return;
  avatarUrl = user.photoURL || '';
  const dpn = user.displayName;
  const username = dpn ?? user.email?.split('@')[0];
  nick = toMekanismiURI(username || '');
}

async function handleSubmit(e: Event) {
  e.preventDefault();

  // Validate nick one more time before submission
  if (!$profile?.nick && (!nick || nickExists)) {
    pushSnack(t('snacks:error.invalidNick'));
    return;
  }

  try {
    // Update Account data to DB
    const account: Partial<Account> = { eulaAccepted: true };
    try {
      await createAccount(account, $uid);
      pushSnack(t('snacks:account.created'));
    } catch (error) {
      await updateAccount(account, $uid);
      pushSnack(t('snacks:eula.accepted'));
    }

    // Create profile if needed
    if (!$profile?.nick && nick && !nickExists) {
      const profileData: Partial<Profile> = {
        nick,
        ...(avatarUrl && { avatarURL: avatarUrl }),
      };
      await createProfile(profileData, $uid);
      pushSnack(t('snacks:profile.created'));
    } else if ($profile?.nick) {
      logWarn('User has a profile, skipping profile creation');
    }
  } catch (error) {
    logError(
      'EulaDialog',
      'handleSubmit',
      'Failed to complete EULA process:',
      error,
    );
    pushSnack(t('snacks:error.general'));
  }
}

async function handleCancel(e?: Event) {
  e?.preventDefault();
  const { signOut, getAuth } = await import('firebase/auth');
  await signOut(getAuth());
}

function handleNickChange(newNick: string, exists: boolean) {
  nick = newNick;
  nickExists = exists;
}
</script>

<dialog id="eula-dialog" class="eula-dialog" bind:this={dialog}>
  <h2>{t('login:eula.title')}</h2>
  <section class="eula-content">
    {@render children?.()}
  </section>
  <form onsubmit={handleSubmit}>
    <section class="surface elevation-3">
      {#if $profile?.nick}
        <!-- LEGACY PROFILE UPGRADE -->
        <h3>
          {t('login:eula.updateNotice.title')}
        </h3>
        <p>
          {t('login:eula.updateNotice.description')}
        </p>
      {:else}
        <NickNameInput
          {nick}
          onNickChange={handleNickChange}
        />
        <p class="profile-info">{t('login:eula.profileInfo')}</p>
      {/if}
    </section>
    <div class="actions">
      <button type="button" class="text" onclick={handleCancel}>
        {t('login:eula.decline')}
      </button>
      <button
        class="cta"
        disabled={!valid}
        type="submit"
      >
        {t('login:eula.accept')}
      </button>
    </div>
  </form>
</dialog>

<style>
  dialog {
    position: fixed;
    inset: 0;
    margin: auto;
    inline-size: min(var(--cn-measure), calc(100dvw - var(--cn-gap) * 2));
    max-inline-size: var(--cn-measure);
    max-block-size: calc(100dvh - var(--cn-gap) * 2);
    display: flex;
    flex-direction: column;
    gap: var(--cn-line);
    padding: var(--cn-gap);
    border: none;
    border-radius: var(--cn-border-radius);
    background-color: var(--cn-color-surface-1);
    color: var(--cn-color-on-surface);
    box-shadow: var(--cn-shadow-elevation-4);
    overflow-y: auto;
  }

  dialog:not([open]) {
    display: none;
  }

  dialog::backdrop {
    background: var(--cn-color-scrim);
  }

  .eula-content {
    max-block-size: 30dvh;
    overflow-y: auto;
    font-size: var(--cn-font-size-small);
    line-height: var(--cn-line-height-small);
  }

  .eula-content :global(p) {
    margin-block-end: var(--cn-gap);
  }

  .eula-content :global(p:last-child) {
    margin-block-end: 0;
  }

  form {
    display: grid;
    row-gap: var(--cn-line);
  }

  .surface {
    display: grid;
    row-gap: var(--cn-gap);
    border-radius: var(--cn-border-radius);
  }

  .profile-info {
    font-size: var(--cn-font-size-caption);
    line-height: var(--cn-line-height-caption);
    color: var(--cn-color-text-low);
  }

  /* TODO(#125): the design system publishes this row as `.actions`. Delete this
     rule and put `.actions.justify-end` on the element. */
  .actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--cn-gap);
  }
</style>