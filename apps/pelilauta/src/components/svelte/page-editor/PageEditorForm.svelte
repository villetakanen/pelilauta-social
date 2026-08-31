<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import CnEditorShell from '@editor/CnEditorShell.svelte';
import type { Page } from 'src/schemas/PageSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSessionSnack, pushSnack } from 'src/utils/client/snackUtils';
import { extractTags } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import { onMount } from 'svelte';
import { uid } from '../../../stores/session';
import { submitPageUpdate } from './submitPageUpdate';

/**
 * This _client side_ component is used to render the form for editing a page.
 *
 * Fields supported
 * - title (textfield)
 * - page-category (select, if categories are available)
 * - content (CnEditor, through the editor shell)
 * - tags (auto-generated from content)
 * - insert an asset from the site media library
 *
 * Actions supported
 * - Delete page
 * - Cancel
 * - Save
 *
 * The view is a consumer of the editor shell: it slots the page's frontmatter —
 * name, category, the legacy-content warning, the tags the content produced,
 * and the actions — and the shell decides the geometry and whether the
 * document is dirty. The shell also asks before a dirty departure, so this
 * form saves and navigates, and guards nothing itself.
 */

interface Props {
  site: Site;
  page: Page;
}
const { site, page }: Props = $props();

let editorValue = $state(page.markdownContent);
let tags = $state<string[]>(page.tags || []);
let contentMigrated = $state(false);
let saving = $state(false);

/*
 * The shell tracks dirtiness; this component only reports it: the fields are
 * native controls inside the region it reads, so a name edited back to what it
 * was leaves the save action disabled, which a set-once flag never managed.
 */
let shell: CnEditorShell | undefined = $state();
let dirty = $state(false);

async function migrateLegacyContent() {
  const { convertToMarkdown } = await import('./migrateContent');
  const md = page.htmlContent
    ? convertToMarkdown(page.htmlContent)
    : page.content || '';
  if (md) contentMigrated = true;
  editorValue = md;
}

onMount(() => {
  /*
   * This runs after the shell has taken its clean snapshot on mount, so the
   * migrated document reads as dirty once it lands — correctly: the writer now
   * holds an unsaved conversion that only exists because the legacy content had
   * no markdown form yet, and it should read as work to save, not as the
   * document's untouched state.
   */
  if (!page.markdownContent && (page.content || page.htmlContent)) {
    migrateLegacyContent();
  }
});

async function handleSubmission(event: Event) {
  event.preventDefault();
  if (saving || !dirty) {
    return;
  }
  saving = true;
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  const changes: Partial<Page> = Object.fromEntries(formData.entries());
  changes.markdownContent = editorValue;
  changes.tags = tags;
  changes.owners = page.owners || [$uid];
  try {
    await submitPageUpdate(page, changes);
    pushSessionSnack(t('site:snacks.pageUpdated'));
    const slug = `/sites/${site.key}/${page.key}`;
    const flowtime = Date.now();

    /*
     * Clean before leaving. The write has landed, so the document the shell is
     * holding is saved — and navigating away from a shell that still reads
     * dirty would raise the browser's guard over a departure the writer
     * asked for.
     */
    shell?.markClean();

    // We have updated the page, asking to update subscriber
    // flowtime on next load (and bypass cache)
    window.location.href = `${slug}?flowtime=${flowtime}`;
  } catch (error) {
    pushSnack(t('snacks:pageUpdateError'));
    logError('Error updating page', error);
    saving = false;
  }
}

function handleEditorChange(content: string) {
  editorValue = content;
  tags = extractTags(editorValue || '');
}

/*
 * Cancel is a departure, so it asks the shell, which answers for whether the
 * writer needs asking first and leaves through the route's one handler.
 */
function cancel() {
  shell?.requestBack();
}
</script>

<form onsubmit={handleSubmission}>
  <CnEditorShell
    bind:this={shell}
    bind:value={editorValue}
    gutter
    disabled={saving}
    placeholder={t('entries:page.markdownContent')}
    onChange={handleEditorChange}
    onDirtyChange={(next) => {
      dirty = next;
    }}
    confirmTitle={t('common:editor.unsaved.title')}
    confirmBody={t('common:editor.unsaved.body')}
    confirmLeave={t('common:editor.unsaved.leave')}
    confirmStay={t('common:editor.unsaved.stay')}
    frontmatter={frontmatter}
  />
</form>

{#snippet frontmatter()}
  <label class="grow">
    {t('entries:page.name')}
    <input
      type="text"
      value={page.name}
      name="name"
      required
      maxlength="42"
      disabled={saving}
      data-testid="page-name"
    />
  </label>

  {#if site.pageCategories && site.pageCategories.length > 0}
    <label>
      {t('entries:page.category')}
      <select name="category" value={page.category} data-testid="page-category">
        {#each site.pageCategories as category}
          <option value={category.slug}>{category.name}</option>
        {/each}
      </select>
    </label>
  {/if}

  {#if contentMigrated}
    <div class="surface notice">
      <CnIcon noun="info" />
      <p>{t('site:page.editor.contentMigrateWarning')}</p>
    </div>
  {/if}

  {#if tags && tags.length > 0}
    <div class="chip-list">
      {#each tags as tag}
        <span class="chip">{tag}</span>
      {/each}
    </div>
  {/if}

  <section class="actions justify-end">
    <a href={`/sites/${site.key}/${page.key}/delete`} class="button text">
      {t('actions:delete')}
    </a>
    <button type="button" disabled={saving} class="button text" onclick={cancel}>
      {t('actions:cancel')}
    </button>
    <button
      type="submit"
      class="button cta"
      data-testid="save-button"
      disabled={saving || !dirty}
    >
      {#if saving}
        <CnLoader inline noun="save" />
      {:else}
        <CnIcon noun="save" />
      {/if}
      <span>{t('actions:save')}</span>
    </button>
  </section>
{/snippet}

<style>
  .notice {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }
</style>
