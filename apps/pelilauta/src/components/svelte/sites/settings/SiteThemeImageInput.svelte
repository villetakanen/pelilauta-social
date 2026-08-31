<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { addAssetToSite } from 'src/firebase/client/site/addAssetToSite';
import type { Site } from 'src/schemas/SiteSchema';
import { resizeImage } from 'src/utils/client/resizeImage';
import { t } from 'src/utils/i18n';
import { logWarn } from 'src/utils/logHelpers';
import { uid } from '../../../../stores/session';
import { update } from '../../../../stores/site';

/**
 * Uploads an avatar, card, or background image to site assets and assigns the asset URL to the site theme.
 */

interface Props {
  site: Site;
  imageField: 'avatarURL' | 'posterURL' | 'backgroundURL';
}
const { site, imageField }: Props = $props();
let preview = $state<string | null>(site[imageField] ?? null);
let file = $state<File | null>(null);

async function fileChanged(e: Event) {
  const target = e.target as HTMLInputElement;
  const f = target.files?.[0];
  if (!f) return;

  const resized = await resizeImage(f);

  // Add file base64 to preview
  const reader = new FileReader();
  reader.onload = () => {
    preview = reader.result as string;
  };
  reader.readAsDataURL(resized);

  // Set file
  file = resized;
}

async function onsubmit(e: Event) {
  e.preventDefault();
  if (!preview) return;

  const f = file;
  if (!f) return;

  if (!$uid) {
    logWarn('SiteThemeImageInput', 'Cannot upload: user not authenticated');
    return;
  }

  const url = await addAssetToSite(site, f, $uid);

  update({
    [imageField]: url,
  });
}

function resetPreview() {
  preview = null;
  file = null;
}

async function deleteImage() {
  update({
    [imageField]: '',
  });
  preview = null;
  file = null;
}
</script>

<form {onsubmit} class="surface elevation-1">
  <div class="image-field">
    {#if preview}
      <img
        src={preview}
        alt={t('app:meta.preview')}
        class="thumbnail"
      />
    {:else}
      <span class="thumbnail-placeholder">
        <CnIcon noun="assets" />
      </span>
    {/if}

    <label>
      {t(`entries:site.${imageField}`)}
      <input type="file" accept="image/*" onchange={fileChanged} />
    </label>
  </div>
  <div class="actions justify-end">
    <button
      type="button"
      disabled={!site[imageField]}
      onclick={deleteImage}
      class="button text"
    >
      {t('actions:delete')}
    </button>

    <button
      type="reset"
      disabled={file === null}
      onclick={resetPreview}
      class="button text"
    >
      {t('actions:reset')}
    </button>
    <button type="submit" disabled={file === null}>
      {t('actions:upload')}
    </button>
  </div>
</form>

<style>
  form {
    display: grid;
    row-gap: var(--cn-line);
  }

  .image-field {
    display: flex;
    gap: var(--cn-gap);
    align-items: flex-start;
  }

  .image-field label {
    flex: 1;
    min-inline-size: 0;
  }

  .thumbnail,
  .thumbnail-placeholder {
    inline-size: calc(var(--cn-grid) * 6);
    block-size: calc(var(--cn-grid) * 6);
    border-radius: var(--cn-border-radius-small);
    flex-shrink: 0;
  }

  .thumbnail {
    object-fit: cover;
  }

  .thumbnail-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--cn-color-surface-2);
  }
</style>
