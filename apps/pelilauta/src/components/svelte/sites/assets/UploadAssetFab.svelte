<script lang="ts">
import { addAssetToSite } from 'src/firebase/client/site/addAssetToSite';
import type { Site } from 'src/schemas/SiteSchema';
import { resizeImage } from 'src/utils/client/resizeImage';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logWarn } from 'src/utils/logHelpers';
import { uid } from '../../../../stores/session';

interface Props {
  site: Site;
}
const { site }: Props = $props();

const visible = $derived.by(() => site.owners.includes($uid));

async function uploadFiles(files: FileList) {
  if (!$uid) {
    logWarn('UploadAssetFab', 'Cannot upload: user not authenticated');
    return;
  }

  for (const file of files) {
    try {
      let fileToUpload = file;

      // Resize images before upload
      if (file.type.startsWith('image/')) {
        fileToUpload = await resizeImage(file);
      }

      // Upload with user ID (validation happens in addAssetToSite)
      await addAssetToSite(site, fileToUpload, $uid);
      pushSnack(t('site:assets.upload.success', { file: file.name }));
    } catch (error) {
      logWarn('UploadAssetFab', `Failed to upload ${file.name}:`, error);
      pushSnack(t('site:assets.upload.error', { file: file.name }));
    }
  }
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const files = input.files;
    await uploadFiles(files);
    input.value = ''; // Clear the input value after processing
  } else {
    logWarn('No files selected or input is empty');
  }
}

function handleButtonClick() {
  const input = document.querySelector('#file-input-fab') as HTMLInputElement;
  if (input) {
    input.click();
  }
}
</script>

{#if visible}
  <input
    id="file-input-fab"
    type="file"
    onchange={handleFileChange}
    style="display: none"
    accept="image/*,video/*,audio/*,application/pdf,application/zip"
  />
  <button class="fab" onclick={handleButtonClick} type="button">
    <cn-icon noun="assets"></cn-icon>
    <span>{t("actions:upload")}</span>
  </button>
{/if}
