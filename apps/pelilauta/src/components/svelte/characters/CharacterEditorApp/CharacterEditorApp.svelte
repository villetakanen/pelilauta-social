<script lang="ts">
import {
  character,
  loading,
  subscribe,
  update,
} from 'src/stores/characters/characterStore';
import { t } from 'src/utils/i18n';
import CodeMirrorEditor from '../../CodeMirrorEditor/CodeMirrorEditor.svelte';

export interface Props {
  characterKey: string;
}
const { characterKey }: Props = $props();
const saving = $state(false);
let dirty = $state(false);
let markdownContent = $state('');

$effect(() => {
  // We subscribe to the character data when the component mounts, if it's
  // changed during edit, we will show a warning or update the view.
  subscribe(characterKey);
});

$effect(() => {
  // Initialize markdownContent when character data loads
  if ($character && !dirty) {
    markdownContent = $character.markdownContent || '';
  }
});

async function handleMarkdownInput(event: CustomEvent<string>) {
  const content = event.detail;
  if (content !== $character?.markdownContent) {
    dirty = true;
    markdownContent = content;
  }
}

async function handleSubmit(event: Event) {
  event.preventDefault();
  // Handle form submission logic here
  console.log('Form submitted for character:', characterKey);
  await update({ markdownContent });
}
</script>

<form
  id="thread-editor"
  class="content-editor"
  onsubmit={handleSubmit}>
    {#if $loading}
      <cn-loader></cn-loader>
    {:else if $character}
      <CodeMirrorEditor
        bind:value={markdownContent}
        name="markdownContent"
        disabled={saving}
        oninput={handleMarkdownInput}
        placeholder={t('entries:thread.placeholders.content')}
      />
      <div class="toolbar">
        <button
          type="submit"
          class="button primary"
          disabled={!dirty || saving}>
          {saving ? t('actions:saving') : t('actions:save')}
        </button>
      </div>
    {/if}



  
</form>
