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
import { toFid } from 'src/utils/toFid';
import { onMount, type Snippet } from 'svelte';
import { uid } from '../../../stores/session';
import NickNameInput from './NickNameInput.svelte';

interface Props {
  children?: Snippet;
}
const { children }: Props = $props();
let dialog: HTMLDialogElement | undefined;
let nick = $state('');
let avatarUrl = $state('');
let nickExists = $state(false);

const valid = $derived.by(() => {
  if ($profile?.nick) return true;
  return !!nick && !nickExists;
});

const handle = $derived.by(() => {
  if ($profile?.nick) return toFid($profile.nick);
  if (nick) return toFid(nick);
  return '–';
});

onMount(() => {
  const d = document.getElementById('eula-dialog');
  if (d) dialog = d as HTMLDialogElement;
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

<dialog id="eula-dialog" class="eula-dialog">
  <h2>{t('login:eula.title')}</h2>
  <section class="downscaled">
    {@render children?.()}
  </section>
  <form onsubmit={handleSubmit}>
    <section class="elevation-3 border-radius p-2 mt-2">
    {#if $profile?.nick}
      <!-- LEGACY PROFILE UPGRADE -->
      <h3 class="downscaled mt-0">
        {t('login:eula.updateNotice.title')}
      </h3>
      <p class="text-small">
        {t('login:eula.updateNotice.description')}
      </p>
    {:else}
      <div class="flex flex-no-wrap">
        <cn-avatar nick={nick} src={avatarUrl}></cn-avatar>
        <fieldset class="grow">
          <NickNameInput
            {nick}
            onNickChange={handleNickChange}
          />
          <p>
            <strong>{t('entries:profile.username')}: </strong>
            <span>{handle}</span>
          </p>
        </fieldset>
      </div>
      <p class="text-caption">{t('login:eula.profileInfo')}</p>
    {/if}
    </section>
    <div class="flex toolbar justify-end">
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