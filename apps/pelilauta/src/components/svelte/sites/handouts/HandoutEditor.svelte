<script lang="ts">
import CnEditor from '@editor/CnEditor.svelte';
import type { Handout } from 'src/schemas/HandoutSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { update } from 'src/stores/site/handouts';
import { t } from 'src/utils/i18n';

interface Props {
  handout: Handout;
  site: Site;
}

const { site, handout }: Props = $props();
let title = $state(handout.title);
let markdownContent = $state(handout.markdownContent);
const changed = $derived.by(() => {
  return handout.title !== title || handout.markdownContent !== markdownContent;
});

function titleChanged(e: Event) {
  title = (e.target as HTMLInputElement).value;
}
function markdownContentChanged(content: string) {
  markdownContent = content;
}

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (!changed) return;

  await update({
    ...handout,
    title,
    markdownContent,
  });

  window.location.href = `/sites/${site.key}/handouts/${handout.key}`;
}
</script>

<form class="editor-form" onsubmit={handleSubmit}>

  <div class="toolbar">
    <label class="grow">
      {t('entries:handout.title')}
      <input type="text" value={handout.title}  oninput={titleChanged}/>
    </label>
  </div>

  <CnEditor
    bind:value={markdownContent}
    onChange={markdownContentChanged}
  />

  <div class="toolbar justify-end">
    <a href={`/sites/${site.key}/handouts/${handout.key}`} class="text button">
      {t('actions:cancel')}
    </a>
    <button type="submit" class="button" disabled={!changed}>
      {t('actions:save')}
    </button>
  </div>

</form>

<style>
  /*
   * As `ThreadEditorForm`: a full-height flex column so `CnEditor` gets the
   * space left over from the fixed-height rows around it.
   */
  .editor-form {
    display: flex;
    flex-direction: column;
    block-size: 100%;
    min-block-size: 0;
    gap: var(--cn-gap);
  }
</style>