<script lang="ts">
import CnToggle from '@design-system/components/CnToggle.svelte';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSessionSnack, pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import { uid } from '../../../stores/session';
import WithAuth from '../app/WithAuth.svelte';
import SystemSelect from './SystemSelect.svelte';

/**
 * A form component used for new Site creation.
 */

// Data states
const siteData: Partial<Site> = $state({
  system: 'homebrew',
  usePlainTextURLs: true,
  description: '',
  hidden: false,
  owners: [$uid],
});

// UX states
let reservedSiteName = $state(false);
let options = $state(false);

const allow = $derived.by(() => {
  return !!$uid;
});

const valid = $derived.by(() => {
  return siteData.key && siteData.key.length > 3 && !reservedSiteName;
});

async function onNameBlur(e: FocusEvent) {
  const { toMekanismiURI } = await import('src/utils/mekanismiUtils');
  const input = e.target as HTMLInputElement;
  const name = input.value;
  const proposedKey = toMekanismiURI(name);

  if (!proposedKey || proposedKey.length < 3) {
    siteData.key = '';
    reservedSiteName = false;
    return;
  }

  // Lets see if the key is available
  const siteResponse = await fetch(`/api/sites/${proposedKey}`);

  if (siteResponse.ok) {
    siteData.key = '';
    reservedSiteName = true;
    return;
  }

  reservedSiteName = false;
  siteData.key = proposedKey;
  siteData.name = name;
  siteData.homepage = proposedKey;
}

async function onsubmit(e: Event) {
  e.preventDefault();

  const { createSite } = await import('src/firebase/client/site/createSite');
  const { addPage } = await import('src/firebase/client/page/addPage');

  try {
    const id = await createSite(siteData);
    await addPage(
      id,
      {
        key: id,
        siteKey: id,
        name: siteData.name,
        markdownContent: `# ${siteData.name}\n\n${siteData.description}`,
        owners: siteData.owners,
      },
      id,
    );
    pushSessionSnack(t('site:snacks.siteCreated', { sitename: `${id}` }));
    window.location.href = `/sites/${id}`;
  } catch (error) {
    pushSnack(t('site:create.snacks.errorCreatingSite'));
    logError(error);
  }
}

function setSystem(s: string) {
  siteData.system = s;
}

function setDescription(e: Event) {
  siteData.description = (e.target as HTMLTextAreaElement).value;
}

function setOptions(e: Event & { currentTarget: HTMLInputElement }) {
  options = e.currentTarget.checked;
}

function setHidden(e: Event & { currentTarget: HTMLInputElement }) {
  siteData.hidden = e.currentTarget.checked;
}

function setUsePlainTextURLs(e: Event & { currentTarget: HTMLInputElement }) {
  siteData.usePlainTextURLs = e.currentTarget.checked;
}
</script>

<WithAuth {allow}>
  <section class="surface">
    <form {onsubmit}>
      <label>
        {t('entries:site.name')}
        <input
          type="text"
          name="name"
          minlength="3"
          required
          onblur={onNameBlur}
          data-error={reservedSiteName ? t('entries:site.errors.reserved') : undefined}
          placeholder={t('entries:site.placeholders.name')}
        />
      </label>
      {#if reservedSiteName}
        <p class="surface error">
          {t('site:create.errors.reserved')}
        </p>
      {/if}
      <p>
        <code>{`https://pelilauta.social/sites/${siteData.usePlainTextURLs ? siteData.key || '...' : '[auto]'}`}</code>
      </p>

      <label>
        {t('entries:site.description')}
        <textarea
          name="description"
          rows="3"
          onblur={setDescription}
          placeholder={t('entries:site.placeholders.description')}></textarea>
      </label>

      <SystemSelect system={siteData.system} {setSystem}/>
      <p>
        {t('site:create.system.description')}
      </p>

      <CnToggle
        label={t('actions:show.options')}
        checked={options}
        onchange={setOptions}
      />

      {#if options}
        <div class="options">
          <CnToggle
            label={t('entries:site.hidden')}
            checked={siteData.hidden ?? false}
            onchange={setHidden} />
          <p>
            {t('site:create.hidden.description')}
          </p>

          <CnToggle
            label={t('entries:site.customPageKeys')}
            checked={siteData.usePlainTextURLs ?? false}
            onchange={setUsePlainTextURLs} />
          <p>
            {t('site:create.plaintexturls.description')}
          </p>
        </div>
      {/if}

      <div class="text-end">
        <a href="/library" class="button text">
          {t('actions:cancel')}
        </a>
        <button 
          disabled={!valid}
          type="submit" 
          class="cta">
          {t('actions:create.site')}
        </button>
      </div>
    </form>
  </section>
</WithAuth>

<style>
  .surface,
  form,
  .options {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>