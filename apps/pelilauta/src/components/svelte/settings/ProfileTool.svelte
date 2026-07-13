<script lang="ts">
import { profile } from '@stores/session/profile';
import { updateProfile } from 'src/firebase/client/profile/updateProfile';
import { uploadAvatar } from 'src/firebase/client/profile/uploadAvatar';
import { type ProfileLink } from 'src/schemas/ProfileSchema';
import { isValidUrl } from 'src/utils/client/isValidUrl';
import { resizeImage } from 'src/utils/client/resizeImage';
import { t } from 'src/utils/i18n';
import { logout, uid } from '../../../stores/session';

let avatarURL = $state($profile?.avatarURL);
let avatarFile = $state<File | null>(null);
let bio = $state($profile?.bio);
let links = $state<ProfileLink[]>($profile?.links || []);
let newLabel = $state('');
let newUrl = $state('');

$effect(() => {
  avatarURL = $profile?.avatarURL;
  bio = $profile?.bio;

  // Only update links from profile if local changes match profile (initial load/reset)
  // or simple check: if we haven't touched them?
  // For simplicity in this patterns: always init, but we rely on 'changes' logic.
  // Actually, we should only reset if profile changes externally.
  // The pattern here seems to reset on every profile store update.
  if ($profile?.links) links = [...$profile.links];
});

const changes = $derived.by(() => {
  if (avatarFile) return true;
  if (bio !== $profile?.bio) return true;
  if (JSON.stringify(links) !== JSON.stringify($profile?.links || []))
    return true;
  return false;
});

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) throw new Error('Invalid file type');
  const resizedFile = await resizeImage(file);

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      avatarURL = reader.result;
    }
  };
  reader.readAsDataURL(resizedFile);

  document.getElementById('avatar-popover')?.removeAttribute('open');

  avatarFile = resizedFile;
}

async function handleSubmit(event: Event) {
  event.preventDefault();
  if (!changes) return;

  if (avatarFile) {
    // Updated the Avatar - lets upload it
    await uploadAvatar(avatarFile);
    avatarFile = null;
  }

  const updates: Record<string, any> = {};
  if (bio !== $profile?.bio) updates.bio = bio;
  if (JSON.stringify(links) !== JSON.stringify($profile?.links || []))
    updates.links = links;

  if (Object.keys(updates).length > 0) {
    await updateProfile(updates, $uid);
  }
}

function addLink() {
  if (!newLabel || !newUrl) return;
  if (!isValidUrl(newUrl)) return; // Should show error ideally, but for now just block

  links = [...links, { label: newLabel, url: newUrl }];
  newLabel = '';
  newUrl = '';
}

function removeLink(index: number) {
  links = links.filter((_, i) => i !== index);
}

function setNewLabel(event: Event) {
  newLabel = (event.target as HTMLInputElement).value;
}

function setNewUrl(event: Event) {
  newUrl = (event.target as HTMLInputElement).value;
}
function setBio(event: Event) {
  bio = (event.target as HTMLTextAreaElement).value;
}
async function logoutAction() {
  await logout();
  window.location.href = '/logout';
}
</script>

<section class="surface">
  <h3>{t("settings:profile.title")}</h3>

  <h4 class="text-h5 m-0">
    {t("entries:profile.uid")}
  </h4>
  <p class="text-small text-low">{$uid}</p>

  <h4 class="text-h5 m-0">
    {t("entries:profile.username")}
  </h4>
  <p class="text-small text-low">{$profile?.username}</p>

  <hr />

  <h4 class="mb-0">
    {t("settings:profile.edit.title")}
  </h4>

  <p class="text-small text-low">
    {t("settings:profile.info")}
  </p>

  <form onsubmit={handleSubmit} class="flex flex-col">
    <label for="avatar-file-input">
      <span>{t("entries:profile.avatar")}</span><br />
      <input
        type="file"
        accept="image/*"
        style="display: none;"
        id="avatar-file-input"
        onchange={onFileChange}
      />
      <cn-avatar-button
        role="button"
        tabindex="0"
        src={avatarURL}
        onkeydown={(e: KeyboardEvent) =>
          e.key === "Enter" &&
          document.getElementById("avatar-file-input")?.click()}
        onclick={() => document.getElementById("avatar-file-input")?.click()}
      ></cn-avatar-button>
    </label>

    <label>
      {t("entries:profile.bio")}
      <textarea oninput={setBio} placeholder={t("entries:profile.bio")}
        >{$profile?.bio}</textarea
      >
    </label>

    <h4 class="mt-2 mb-0">Julkiset linkit</h4>
    <p class="text-small text-low mt-0 mb-2">
      Lisää linkkejä profiiliisi, esim. portfolio tai blogi.
    </p>

    <ul class="flex flex-col gap-1 p-0 m-0 list-none mb-2">
      {#each links as link, index}
        <li class="flex items-center justify-between p-2 surface-2 radius-s">
          <div class="flex flex-col overflow-hidden" style="max-width: 80%">
            <span class="text-small text-high truncate">{link.label}</span>
            <span
              class="text-small text-low truncate"
              style="font-size: 0.75rem">{link.url}</span
            >
          </div>
          <button
            type="button"
            class="button-icon small"
            onclick={() => removeLink(index)}
            aria-label="Poista linkki"
          >
            <cn-icon noun="trash" small></cn-icon>
          </button>
        </li>
      {/each}
    </ul>

    <div class="flex flex-col gap-2 p-2 border radius-s">
      <label class="text-small">
        Otsikko
        <input
          type="text"
          value={newLabel}
          oninput={setNewLabel}
          placeholder="Esim. Kotisivu"
        />
      </label>
      <label class="text-small">
        URL
        <input
          type="url"
          value={newUrl}
          oninput={setNewUrl}
          placeholder="https://example.com"
        />
      </label>
      <button
        type="button"
        class="button w-full"
        onclick={addLink}
        disabled={!newLabel || !newUrl || !isValidUrl(newUrl)}
      >
        Lisää linkki
      </button>
    </div>

    <div class="toolbar items-center mt-2">
      <button type="submit" disabled={!changes}>
        {t("actions:save")}
      </button>
    </div>
  </form>
</section>
