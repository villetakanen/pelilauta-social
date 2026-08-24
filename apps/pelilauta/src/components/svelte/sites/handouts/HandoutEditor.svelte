<script lang="ts">
/**
 * Handout authoring, for the edit route.
 *
 * The view is a consumer of the editor shell: it slots the handout's
 * frontmatter — the title — and the actions, and the shell decides the
 * geometry and whether the document is dirty. The shell also asks before a
 * dirty departure, so this form saves and navigates, and guards nothing
 * itself.
 */
import CnEditorShell from '@editor/CnEditorShell.svelte';
import type { Handout } from 'src/schemas/HandoutSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { update } from 'src/stores/site/handouts';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';

interface Props {
  handout: Handout;
  site: Site;
}

const { site, handout }: Props = $props();
let title = $state(handout.title);
let markdownContent = $state(handout.markdownContent);

/*
 * The shell tracks dirtiness; this component only reports it: the title is
 * a native control inside the region it reads, so a title edited back to
 * what it was leaves the save action disabled, which the view's diff
 * used to manage by hand.
 */
let shell: CnEditorShell | undefined = $state();
let dirty = $state(false);

function titleChanged(e: Event) {
  title = (e.target as HTMLInputElement).value;
}
function markdownContentChanged(content: string) {
  markdownContent = content;
}

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (!dirty) return;

  try {
    await update({
      ...handout,
      title,
      markdownContent,
    });
    /*
     * Clean before leaving. The write has landed, so the document the shell
     * is holding is saved — and navigating away from a shell that still
     * reads dirty would raise the browser's guard over a departure the
     * writer asked for.
     */
    shell?.markClean();
    window.location.href = `/sites/${site.key}/handouts/${handout.key}`;
  } catch (error) {
    logError('HandoutEditor', 'handleSubmit', error);
    pushSnack(t('common:error.generic'));
  }
}

/*
 * Cancel is a departure, so it asks the shell, which answers for whether the
 * writer needs asking first and leaves through the route's one handler.
 */
function cancel() {
  shell?.requestBack();
}
</script>

<form id="handout-editor" onsubmit={handleSubmit}>
  <CnEditorShell
    bind:this={shell}
    bind:value={markdownContent}
    name="markdownContent"
    onChange={markdownContentChanged}
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
  <label>
    {t('entries:handout.title')}
    <input
      type="text"
      name="title"
      value={handout.title}
      oninput={titleChanged}
    />
  </label>

  <section class="actions">
    <button type="button" class="text" onclick={cancel}>
      {t('actions:cancel')}
    </button>
    <button type="submit" class="button" disabled={!dirty}>
      {t('actions:save')}
    </button>
  </section>
{/snippet}

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--cn-gap);
    margin-block-start: var(--cn-line);
  }
</style>
