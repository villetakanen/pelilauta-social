<script lang="ts">
import type { Character } from 'src/schemas/CharacterSchema';
import { t } from 'src/utils/i18n';
import type { Snippet } from 'svelte';
import SiteLink from '../sites/SiteLink.svelte';

export interface CharacterCardProps {
  character: Character;
  children?: Snippet;
  actions?: Snippet;
}
const { character, children, actions }: CharacterCardProps = $props();

const systemKey = $derived.by(() => character.systemKey || undefined);
</script>

<cn-card
  href={`/characters/${character.key}`}
  title={character.name}
  noun={systemKey}
>
  {#if character.siteKey}
    <p class="downscaled">
      <strong>{t('entries:character.site')}</strong>:<br /><SiteLink siteKey={character.siteKey} />
    </p>
  {/if}

  {#if character.description}
    <p class="downscaled text-low">
      {character.description}
    </p>
  {/if}
  <!-- Default content inside the card -->
  {@render children?.()}
  <!-- The card Actions slot -->
  {#if actions}
    <div slot="actions">
      {@render actions()}
    </div>
  {/if}
</cn-card>

