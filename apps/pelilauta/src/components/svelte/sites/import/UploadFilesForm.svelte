<script lang="ts">
import { importStore } from 'src/stores/site/importsStore';
import { parseFrontmatter, toEntryDate } from 'src/utils/entryConversions';
import { t } from 'src/utils/i18n';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';
import { site } from '../../../../stores/site';

let fileInput = $state<HTMLInputElement | undefined>();
let isUploading = $state(false);
const uploadedFiles = $state<
  {
    name: string;
    content: string;
    frontmatter: Record<string, unknown>;
    body: string;
  }[]
>([]);

function handleFileSelect() {
  const files = fileInput?.files;
  if (!files || files.length === 0) return;

  logDebug('UploadFilesForm', 'Files selected:', files.length);
  processFiles(files);
}

async function processFiles(files: FileList) {
  isUploading = true;
  const processedFiles = [];

  try {
    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.md')) {
        logWarn('UploadFilesForm', 'Skipping non-markdown file:', file.name);
        continue;
      }

      const content = await readFileAsText(file);
      const parsed = parseFrontmatter(content);

      processedFiles.push({
        name: file.name,
        content,
        frontmatter: parsed.frontmatter,
        body: parsed.body,
      });

      logDebug(
        'UploadFilesForm',
        'Processed file:',
        file.name,
        parsed.frontmatter,
      );
    }

    uploadedFiles.splice(0, uploadedFiles.length, ...processedFiles);

    // Get existing page names from the site
    const currentSite = $site;
    const existingPageNames =
      currentSite?.pageRefs?.map((ref) => ref.name) || [];

    // Add to import store with existing page information
    importStore.addPages(
      processedFiles.map((file) => {
        const title =
          (typeof file.frontmatter.title === 'string'
            ? file.frontmatter.title
            : null) ||
          (typeof file.frontmatter.name === 'string'
            ? file.frontmatter.name
            : null) ||
          file.name.replace('.md', '');

        // Imported pages keep the dates of the system they came from, so the
        // site index orders them by when they were written, not imported.
        const createdAt = toEntryDate(
          file.frontmatter.createdAt ?? file.frontmatter.created,
        );
        const updatedAt = toEntryDate(
          file.frontmatter.updatedAt ?? file.frontmatter.updated,
        );

        return {
          name: title,
          markdownContent: file.body,
          fileName: file.name,
          category:
            typeof file.frontmatter.category === 'string'
              ? file.frontmatter.category
              : undefined,
          createdAt,
          updatedAt,
          flowTime: (updatedAt ?? createdAt)?.getTime(),
        };
      }),
      existingPageNames,
    );
  } catch (error) {
    logError('UploadFilesForm', 'Error processing files:', error);
  } finally {
    isUploading = false;
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function triggerFileSelect() {
  fileInput?.click();
}

function clearUploads() {
  uploadedFiles.splice(0, uploadedFiles.length);
  importStore.clear();
  if (fileInput) {
    fileInput.value = '';
  }
}

const hasFiles = $derived(uploadedFiles.length > 0);
</script>

<section class="surface">
  <h2>{t('site:import.upload.title')}</h2>
  <p>{t('site:import.upload.description')}</p>
  
  <input
    type="file"
    multiple
    accept=".md,.markdown"
    bind:this={fileInput}
    onchange={handleFileSelect}
    style="display: none;"
  />
  
  <div class="actions justify-start">
    <button onclick={triggerFileSelect} disabled={isUploading} type="button">
      {isUploading ? t('site:import.upload.processing') : t('site:import.upload.select')}
    </button>
    
    {#if hasFiles}
      <button class="text" onclick={clearUploads} type="button">
        {t('site:import.upload.clear', { count: uploadedFiles.length })}
      </button>
    {/if}
  </div>
  
  {#if hasFiles}
    <div>
      <h3>{t('site:import.upload.ready')}</h3>
      <ul role="list">
        {#each uploadedFiles as file}
          <li>
            <strong>{file.name}</strong>
            {#if file.frontmatter.title}
              → "{file.frontmatter.title}"
            {/if}
            {#if file.frontmatter.category}
              <span>{t('site:import.upload.category', { category: `${file.frontmatter.category}` })}</span>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<style>
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>
