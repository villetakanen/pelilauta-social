<script lang="ts">
import { toMekanismiURI } from '@utils/mekanismiUtils';
import { toFid } from '@utils/toFid';
import { t } from 'src/utils/i18n';
import { onMount } from 'svelte';

interface NickNameInputProps {
  nick: string;
  onNickChange: (nick: string, exists: boolean) => void;
}
const { nick, onNickChange }: NickNameInputProps = $props();
let exists = $state(false);
let currentNick = $state(nick);
let avatarUrl = $state('');

onMount(async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  getUserInfo();
});

async function getUserInfo() {
  const { auth } = await import('../../../firebase/client');
  const user = auth.currentUser;
  if (!user) return;
  avatarUrl = user.photoURL || '';
  const dpn = user.displayName;
  const username = dpn ?? user.email?.split('@')[0];
  currentNick = toMekanismiURI(username || '');
  onNickChange(currentNick, exists);
}

// Keep currentNick in sync with prop changes
$effect(() => {
  currentNick = nick;
});

async function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const newNick = target.value;
  currentNick = newNick;
  onNickChange(newNick, exists);
}

async function onBlur(event: Event) {
  const target = event.target as HTMLInputElement;
  const nickValue = target.value;

  if (!nickValue) {
    exists = false;
    onNickChange(nickValue, false);
    return;
  }

  // Check for duplicates on blur
  const hasDuplicate = await checkForDuplicate(nickValue);
  exists = hasDuplicate;
  onNickChange(nickValue, hasDuplicate);
}
const handle = $derived.by(() => {
  if (currentNick) return toFid(currentNick);
  return '–';
});

async function checkForDuplicate(nickname: string): Promise<boolean> {
  if (!nickname) return false;

  try {
    const { getDocs, getFirestore, collection, query, where } = await import(
      'firebase/firestore'
    );
    const { auth } = await import('../../../firebase/client');
    const db = getFirestore();
    const username = toFid(nickname);

    const q = query(
      collection(db, 'profiles'),
      where('username', '==', username),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return false;

    // If we found a doc, check if it's ours
    const currentUserUid = auth.currentUser?.uid;
    const existingDoc = snapshot.docs[0];

    if (currentUserUid && existingDoc.id === currentUserUid) {
      return false; // It's our own profile, so not a duplicate in the sense of "taken by someone else"
    }

    return true;
  } catch (error) {
    console.error('Error checking nickname:', error);
    return false;
  }
}
</script>

<div class="flex flex-no-wrap">
  <cn-avatar {nick} src={avatarUrl}></cn-avatar>
  <fieldset class="grow">
    <label>
      {t("entries:profile.nick")}
      <input
        type="text"
        value={currentNick}
        oninput={onInput}
        onblur={onBlur}
        data-error={exists}
      />
    </label>
    {#if exists}
      <p class="alert p-0 m-0">{t("login:eula.nickTaken")}</p>
    {/if}
    <p>
      <strong>{t("entries:profile.username")}: </strong>
      <span>{handle}</span>
    </p>
  </fieldset>
</div>
