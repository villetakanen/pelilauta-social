<script lang="ts">
/*
 * A component to display the character's markdown content as an article.column-l
 */

import type { Character } from '@schemas/CharacterSchema';
import { canEdit } from '@stores/characters/characterStore';
import { t } from '@utils/i18n';
import { marked } from 'marked';

interface Props {
  character: Character;
}

const { character }: Props = $props();

// Client-side reactive content parsing
const htmlContent = $derived.by(() => {
  if (!character) return '';
  const content = character.markdownContent || '-';
  if (!content) return '';
  return marked.parse(content);
});
</script>

{#if character && htmlContent}
  <article class="column-l surface p-2 border-radius">
    <div class="toolbar">
      <h2 class="downscaled">
        {t('characters:character.markdown')}
      </h2>
      {#if $canEdit}
        <a href={`/characters/${character.key}/edit`} class="button text">
          <cn-icon noun="edit"></cn-icon>
          <span>{t('actions:edit')}</span>
        </a>
      {/if}
    </div>
    
    {@html htmlContent}
    
  </article>
{/if}
