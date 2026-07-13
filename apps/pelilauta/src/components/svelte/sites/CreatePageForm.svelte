<script lang="ts">
import { PageSchema } from 'src/schemas/PageSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSessionSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logDebug } from 'src/utils/logHelpers';
import { toMekanismiURI } from 'src/utils/mekanismiUtils';
import { uid } from '../../../stores/session';
import MembersOnly from './MembersOnly.svelte';

interface Props {
  site: Site;
  name?: string;
  category?: string;
}
const { site, name = '', category: targetCategory = '' }: Props = $props();

let title = $state(name);
let category = $state('');
let saving = $state(false);

const urlKey = $derived.by(() => {
  if (!site.usePlainTextURLs || !title.trim()) return null;
  return toMekanismiURI(title);
});

const hasKeyClash = $derived.by(() => {
  if (!urlKey) return false;
  return site.pageRefs?.some((ref) => ref.key === urlKey) ?? false;
});

const canSubmit = $derived.by(() => {
  // Need to have
  // - 1 or more characters in the title
  // - Not saving
  // - No key clashes
  return title.trim() && !saving && !hasKeyClash;
});

const previewUrl = $derived.by(() => {
  if (!urlKey) return `${site.name}/[auto]`;
  return `${site.name}/${urlKey}`;
});

async function onsubmit(e: Event) {
  e.preventDefault();

  // Prevent double submission, and
  // submission if the user is not logged in
  if (!$uid || !canSubmit) return;

  saving = true;

  try {
    logDebug('CreatePageForm', 'Creating page:', { title, category });

    const { addPage } = await import('src/firebase/client/page/addPage');
    const { pageFrom } = await import('src/schemas/PageSchema');

    const page = PageSchema.parse({
      key: urlKey || '',
      siteKey: site.key,
      name: title,
      markdownContent: `# ${title}\n\n`,
      category: category || '',
      owners: [$uid],
    });

    const slug = await addPage(site.key, pageFrom(page), urlKey ?? undefined);
    pushSessionSnack(t('site:page.created', { key: `${site.key}/${slug}` }));
    window.location.href = `/sites/${site.key}/${slug}`;
  } catch (e) {
    logDebug('CreatePageForm', 'Error creating page:', e);
    pushSessionSnack(t('site:page.createError'));
  } finally {
    saving = false;
  }
}

function cancel() {
  // This is a bit of a hack, but the compiler doesn't like
  // us setting title and category with 'let' if we only
  // set them via bind:value - and bind:value does not work
  // with 'const' variables.
  title = '';
  category = '';
  window.history.back();
}
</script>

<div class="content-columns">
  <MembersOnly {site}>
    <section>
      <h2>{t('site:create.page.title')}</h2>

      <form {onsubmit}>
        {#if name}
          <p>
            <i>{t('site:create.page.missing', { name: `${name}` })}</i>
          </p>
        {:else}
          <label>
            {t('entries:page.name')}
            <input
              data-error={hasKeyClash || undefined}
              data-testid="page-name-input"
              bind:value={title}
              type="text"
              name="title">
          </label>

          {#if site.pageCategories && site.pageCategories.length > 0}
          <label>
            {t('entries:page.category')}
            <select bind:value={category} data-testid="page-category-select">
              <option value="">-</option>
              {#each site.pageCategories as cat}
                <option value={cat.slug}>{cat.name}</option>
              {/each}
            </select>
          </label>
          {/if}
          
          {#if hasKeyClash}
            <p class="error p-1">
              {t('site:create.page.duplicateKey', { key: `${site.key}/${urlKey}` })}
            </p>
            <p class="downscaled">
              <a href={`/sites/${site.key}/${urlKey}`}>{t('site:create.page.duplicateKeyLink')}</a>
            </p>
          {:else}
            <p class="mt-1 break-all">
              <code class="p-1">{previewUrl}</code>
            </p>
          {/if}
        {/if}
        
        <div class="toolbar justify-end">
          <button type="button" class="text" onclick={cancel}>
            {t('actions:cancel')}
          </button>
          <button type="submit" data-testid="create-page-button">
            <cn-icon noun="add"></cn-icon>
            <span>{t('actions:create.page')}</span>
          </button>
        </div>
      </form>

    </section>
  </MembersOnly>
</div>