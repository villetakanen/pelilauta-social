<script lang="ts">
import { ASSET_LICENSES_KEYS } from '@schemas/AssetSchema';
import { systemToNounMapping } from '@schemas/nouns';
import {
  activeSite,
  dirty,
  init,
  isSaving,
  reset,
  updateSite,
} from '@stores/site/siteEditorStore';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logError, logWarn } from 'src/utils/logHelpers';
import LicenseSelect from '../assets/LicenseSelect.svelte';
import SystemSelect from '../SystemSelect.svelte';
import SiteExtraSettingsPane from './SiteExtraSettingsPane.svelte';

interface Props {
  site: Site;
}
const { site }: Props = $props();

$effect(() => {
  // Only reset form when site prop changes if there are no unsaved edits
  if (!$dirty) {
    init(site);
  } else {
    logWarn(
      'SiteMetaForm',
      'Site prop changed but form has unsaved changes - keeping local edits',
    );
  }
});

function setName(value: string) {
  if (!$activeSite) return;

  // Validation: name must be at least 3 characters
  if (value.trim().length < 3) {
    logWarn('SiteMetaForm', 'Site name must be at least 3 characters');
    return;
  }

  activeSite.set({ ...$activeSite, name: value });
}

function setDescription(value: string) {
  if (!$activeSite) return;
  activeSite.set({ ...$activeSite, description: value });
}

function setSystem(value: string) {
  if (!$activeSite) return;

  // Validation guard: ensure system is valid
  if (!Object.keys(systemToNounMapping).includes(value)) {
    logError('SiteMetaForm', `Invalid system value: ${value}`);
    pushSnack(`✗ ${t('errors:site.invalid.system')}`);
    return;
  }

  activeSite.set({ ...$activeSite, system: value });
}

function setLicense(value: string) {
  if (!$activeSite) return;

  // Validation guard: ensure license is valid or empty
  if (value && ASSET_LICENSES_KEYS.indexOf(value) === -1) {
    logError('SiteMetaForm', `Invalid license value: ${value}`);
    pushSnack(`✗ ${t('errors:site.invalid.license')}`);
    return;
  }

  activeSite.set({ ...$activeSite, license: value || undefined });
}

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (!$activeSite || !$dirty) return;

  try {
    // Final validation before submit
    if ($activeSite.name.trim().length < 3) {
      pushSnack(`✗ ${t('errors:site.name.too.short')}`);
      return;
    }

    await updateSite({
      name: $activeSite.name,
      description: $activeSite.description,
      system: $activeSite.system,
      license: $activeSite.license,
    });

    pushSnack(t('site:settings.meta.saved'));
  } catch (error) {
    logError(
      'SiteMetaForm:handleSubmit',
      'Failed to save site metadata',
      error,
    );
    pushSnack(`✗ ${t('errors:site.update.failed')}`);
  }
}

const descriptionLength = $derived($activeSite?.description?.length || 0);
</script>

<section>
  <h2>{t('site:settings.meta.title')}</h2>
  <form
    onsubmit={handleSubmit}
    onreset={reset}
    
  >
    <fieldset class:elevation-1={$dirty}>
      <legend>{t('site:settings.meta.fieldset')}</legend>
      <label>{t('entries:site.name')}
        <input
          type="text"
          value={$activeSite?.name}
          placeholder={t('entries:site.placeholders.name')}
          required
          name="name"
          minlength="3"
          oninput={(e) => setName((e.target as HTMLInputElement).value)}
        />
      </label>
      <label>{t('entries:site.description')}
        <textarea
          name="description"
          rows="4"
          oninput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
          placeholder={t('entries:site.placeholders.description')}>{$activeSite?.description}</textarea>
      </label>

      <p class="text-caption text-low">{t('seo:description.length', { length: descriptionLength })}</p>

      <SystemSelect
        system={$activeSite?.system || ''}
        {setSystem}/>
      <LicenseSelect 
        value={$activeSite?.license || ''} 
        onchange={(e) => setLicense((e.target as HTMLSelectElement).value)}/>
    <div class="toolbar justify-end">
      <button 
        type="button" 
        onclick={reset} 
        class="text" 
        disabled={!$dirty || $isSaving}>{t('actions:reset')}</button>
      <button 
        type="submit" 
        disabled={!$dirty || $isSaving}>
        {#if $isSaving}
          <cn-loader noun="save"></cn-loader>
        {:else}
          <cn-icon noun="save"></cn-icon>
        {/if}
          <span>{t('actions:save')}</span>
      </button>
    </div>
    </fieldset> 
  </form>
  
  <SiteExtraSettingsPane />
</section>