<script lang="ts">
import type { CnToggleButton } from '@11thdeg/cyan-lit';

/**
 * Extra settings panel for site configuration.
 *
 * NOTE: This component uses direct updates via the site store (not siteEditorStore).
 * Unlike the metadata form which uses optimistic updates with preview functionality,
 * these settings are applied immediately without local state management.
 * This is intentional - extra settings don't need preview/reset/dirty tracking.
 */
import { site, update } from '@stores/site';
import { t } from '@utils/i18n';

async function setHidden(e: Event) {
  const value = (e.target as CnToggleButton).pressed;
  await update({ hidden: value });
}
</script>

{#if $site}
  <fieldset>
    <legend>{t('site:settings.meta.extra')}</legend>
  
    <cn-toggle-button
      label={t('entries:site.hidden')}
      pressed={$site.hidden}
      onchange={setHidden}></cn-toggle-button>
  
    <p class="text-caption text-low">
      {t('site:create.hidden.description')}
    </p>
  </fieldset>
{/if}