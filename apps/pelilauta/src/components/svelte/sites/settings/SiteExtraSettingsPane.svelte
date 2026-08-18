<script lang="ts">
/**
 * Extra settings panel for site configuration.
 *
 * NOTE: This component uses direct updates via the site store (not siteEditorStore).
 * Unlike the metadata form which uses optimistic updates with preview functionality,
 * these settings are applied immediately without local state management.
 * This is intentional - extra settings don't need preview/reset/dirty tracking.
 */
import CnToggle from '@design-system/components/CnToggle.svelte';
import { site, update } from '@stores/site';
import { t } from '@utils/i18n';

async function setHidden(e: Event & { currentTarget: HTMLInputElement }) {
  await update({ hidden: e.currentTarget.checked });
}
</script>

{#if $site}
  <fieldset>
    <legend>{t('site:settings.meta.extra')}</legend>
  
    <CnToggle
      label={t('entries:site.hidden')}
      checked={$site.hidden ?? false}
      onchange={setHidden} />
  
    <p class="text-caption text-low">
      {t('site:create.hidden.description')}
    </p>
  </fieldset>
{/if}