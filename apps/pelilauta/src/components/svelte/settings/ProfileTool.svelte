<script lang="ts">
import CnAvatar from '@design-system/components/CnAvatar.svelte';
import CnIcon from '@design-system/components/CnIcon.svelte';
import { profile } from '@stores/session/profile';
import { updateProfile } from 'src/firebase/client/profile/updateProfile';
import { uploadAvatar } from 'src/firebase/client/profile/uploadAvatar';
import { type ProfileLink } from 'src/schemas/ProfileSchema';
import { isValidUrl } from 'src/utils/client/isValidUrl';
import { resizeImage } from 'src/utils/client/resizeImage';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';

let avatarURL = $state($profile?.avatarURL);
let avatarFile = $state<File | null>(null);
let bio = $state($profile?.bio);
let links = $state<ProfileLink[]>($profile?.links || []);
let newLabel = $state('');
let newUrl = $state('');

$effect(() => {
  avatarURL = $profile?.avatarURL;
  bio = $profile?.bio;

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

  const updates: Record<string, unknown> = {};
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
</script>

<section class="surface">
  <h3>{t("settings:profile.title")}</h3>

  <div class="meta-field">
    <span class="text-label">{t("entries:profile.uid")}</span>
    <span class="text-small text-low">{$uid}</span>
  </div>

  <div class="meta-field">
    <span class="text-label">{t("entries:profile.username")}</span>
    <span class="text-small text-low">{$profile?.username}</span>
  </div>

  <hr />

  <h4>{t("settings:profile.edit.title")}</h4>
  <p class="text-small text-low">{t("settings:profile.info")}</p>

  <form onsubmit={handleSubmit}>
    <label class="avatar-trigger">
      <span class="text-label">{t("entries:profile.avatar")}</span>
      <input
        type="file"
        accept="image/*"
        class="visually-hidden"
        onchange={onFileChange}
      />
      <div class="avatar-wrapper">
        <CnAvatar src={avatarURL} nick={$profile?.nick} size="large" aria-hidden />
      </div>
    </label>

    <label>
      {t("entries:profile.bio")}
      <textarea
        value={bio}
        oninput={setBio}
        placeholder={t("entries:profile.bio")}
      ></textarea>
    </label>

    <div class="links-section">
      <h4>Julkiset linkit</h4>
      <p class="text-small text-low">
        Lisää linkkejä profiiliisi, esim. portfolio tai blogi.
      </p>

      {#if links.length > 0}
        <ul class="links-list">
          {#each links as link, index}
            <li class="link-item">
              <div class="link-info">
                <span class="text-small text-high">{link.label}</span>
                <span class="text-caption text-low">{link.url}</span>
              </div>
              <button
                type="button"
                class="text"
                onclick={() => removeLink(index)}
                aria-label="Poista linkki"
              >
                <CnIcon noun="delete" />
              </button>
            </li>
          {/each}
        </ul>
      {/if}

      <div class="add-link-box">
        <label>
          Otsikko
          <input
            type="text"
            value={newLabel}
            oninput={setNewLabel}
            placeholder="Esim. Kotisivu"
          />
        </label>
        <label>
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
          class="button"
          onclick={addLink}
          disabled={!newLabel || !newUrl || !isValidUrl(newUrl)}
        >
          Lisää linkki
        </button>
      </div>
    </div>

    <div class="text-end">
      <button type="submit" disabled={!changes}>
        {t("actions:save")}
      </button>
    </div>
  </form>
</section>

<style>
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }

  .meta-field {
    display: flex;
    flex-direction: column;
  }

  form {
    display: grid;
    row-gap: var(--cn-line);
  }

  .avatar-trigger {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: calc(var(--cn-grid) * 0.5);
    cursor: pointer;
  }

  .avatar-wrapper {
    display: inline-flex;
    border-radius: 50%;
  }

  .avatar-trigger:focus-within .avatar-wrapper {
    outline: 2px solid var(--cn-color-focus-ring);
    outline-offset: 2px;
  }

  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    clip-path: inset(50%);
    overflow: hidden;
    white-space: nowrap;
  }

  .links-section {
    display: grid;
    row-gap: calc(var(--cn-grid) * 0.5);
  }

  .links-list {
    display: flex;
    flex-direction: column;
    gap: calc(var(--cn-grid) * 0.5);
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .link-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--cn-grid) var(--cn-gap);
    background-color: var(--cn-color-surface-2);
    border-radius: var(--cn-border-radius-small);
  }

  .link-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-inline-size: 80%;
  }

  .link-info span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .add-link-box {
    display: grid;
    row-gap: calc(var(--cn-grid) * 0.5);
    padding: var(--cn-gap);
    background-color: var(--cn-color-surface-2);
    border-radius: var(--cn-border-radius-small);
  }
</style>
