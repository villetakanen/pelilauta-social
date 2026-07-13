<script lang="ts">
import type { Handout } from 'src/schemas/HandoutSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { update } from 'src/stores/site/handouts';
import { t } from 'src/utils/i18n';
import { uid } from '../../../../stores/session';
import WithAuth from '../../app/WithAuth.svelte';
import CodeMirrorEditor from '../../CodeMirrorEditor/CodeMirrorEditor.svelte';

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

const visible = $derived.by(() => {
  if (site.owners.includes($uid)) return true;
  return false;
});

function titleChanged(e: Event) {
  title = (e.target as HTMLInputElement).value;
}
function markdownContentChanged(e: CustomEvent<string>) {
  markdownContent = e.detail;
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

<WithAuth allow={visible}>
  <form class="content-editor" onsubmit={handleSubmit}>

    <div class="toolbar">
      <label class="grow">
        {t('entries:handout.title')}
        <input type="text" value={handout.title}  oninput={titleChanged}/>
      </label>
    </div>
    
    <CodeMirrorEditor
      bind:value={markdownContent}
      oninput={markdownContentChanged}
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
</WithAuth>