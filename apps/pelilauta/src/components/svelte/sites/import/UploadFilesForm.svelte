<script lang="ts">
import { importStore } from 'src/stores/site/importsStore';
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
      const parsed = parseMdFile(content);

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

        return {
          name: title,
          markdownContent: file.body,
          fileName: file.name,
          category:
            typeof file.frontmatter.category === 'string'
              ? file.frontmatter.category
              : undefined,
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

function parseMdFile(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: {},
      body: content,
    };
  }

  const [, frontmatterStr, body] = match;
  const frontmatter: Record<string, unknown> = {};

  // Simple YAML parsing for frontmatter
  const lines = frontmatterStr.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();

    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Try to parse as number or boolean
    if (value === 'true') {
      frontmatter[key] = true;
    } else if (value === 'false') {
      frontmatter[key] = false;
    } else if (
      value.trim() !== '' &&
      !Number.isNaN(Number(value)) &&
      value.trim() === value
    ) {
      frontmatter[key] = Number(value);
    } else {
      frontmatter[key] = value;
    }
  }

  return {
    frontmatter,
    body: body.trim(),
  };
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

<section class="column-s surface p-2">
  <h2>Upload Markdown Files</h2>
  <p class="text-low">Select one or more .md files to import. Frontmatter will be parsed as page metadata.</p>
  
  <input
    type="file"
    multiple
    accept=".md,.markdown"
    bind:this={fileInput}
    onchange={handleFileSelect}
    style="display: none;"
  />
  
  <div class="toolbar">
    <button class="button" onclick={triggerFileSelect} disabled={isUploading}>
      {isUploading ? 'Processing...' : 'Select Files'}
    </button>
    
    {#if hasFiles}
      <button class="button outlined" onclick={clearUploads}>
        Clear ({uploadedFiles.length})
      </button>
    {/if}
  </div>
  
  {#if hasFiles}
    <div class="mt-2">
      <h3 class="downscaled">Files Ready for Import</h3>
      <ul class="text-small">
        {#each uploadedFiles as file}
          <li>
            <strong>{file.name}</strong>
            {#if file.frontmatter.title}
              → "{file.frontmatter.title}"
            {/if}
            {#if file.frontmatter.category}
              <span class="text-low">(category: {file.frontmatter.category})</span>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</section>
