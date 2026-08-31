<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import type { Handout } from 'src/schemas/HandoutSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { update } from 'src/stores/site/handouts';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logDebug } from 'src/utils/logHelpers';
import { uid } from '../../../../stores/session';
import { site } from '../../../../stores/site';
import ProfileLink from '../../app/ProfileLink.svelte';
import UserSelect from '../../app/UserSelect.svelte';

interface Props {
  site: Site;
  handout: Handout;
}
const { site: initialSite, handout }: Props = $props();
let newReader = $state('');
let readers = $state(handout.readers ?? ([] as string[]));

const visible = $derived.by(() => {
  if ($site?.owners?.includes($uid)) return true;
  return false;
});
const omit = $derived.by(() => {
  const omitted = new Set($site?.owners);
  for (const reader of readers ?? []) {
    omitted.add(reader);
  }
  return Array.from(omitted);
});

$site = initialSite;

function onUserSelect(e: Event) {
  const target = e.target as HTMLSelectElement;
  newReader = target.value;
}

async function dropReader(reader: string) {
  const r = new Set(readers);
  r.delete(reader);
  await update({
    ...handout,
    readers: Array.from(r),
  });
  readers = Array.from(r);
}

async function onSubmit(e: Event) {
  e.preventDefault();
  logDebug('HandoutMeta.onSubmit', newReader);
  const r = new Set(readers);
  r.add(newReader);
  try {
    await update({
      ...handout,
      readers: Array.from(r),
    });
  } catch (err) {
    logDebug('HandoutMeta.onSubmit', err);
    pushSnack(t('site:handouts.metadata.error'));
  }
  newReader = '';
  readers = Array.from(r);
}
</script>

{#if visible}
  <section class="surface">
    <h3>{t('site:handouts.metadata.title')}</h3>
    {#if readers?.length}
      <ul class="reader-list">
        {#each readers as reader (reader)}
          <li class="reader-row">
            <span class="reader-link">
              <ProfileLink uid={reader} />
            </span>
            <button
              type="button"
              class="button text icon-only"
              aria-label={t('actions:delete')}
              onclick={() => dropReader(reader)}
            >
              <CnIcon noun="delete" />
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <form onsubmit={onSubmit}>
      <hr />
      <UserSelect
        value="-"
        {omit}
        onchange={onUserSelect}
        label={t('site:handouts.add.reader')}
      />
      <div class="actions justify-end">
        <button
          disabled={!newReader || newReader === '-'}
          type="submit"
        >
          <CnIcon noun="add" />
          <span>{t('actions:add')}</span>
        </button>
      </div>
    </form>
  </section>
{/if}

<style>
  /*
   * .surface publishes padding and containment only, so this box states
   * the interval between its own child blocks.
   */
  .surface,
  form {
    display: grid;
    row-gap: var(--cn-line);
  }

  .reader-list {
    display: grid;
    row-gap: var(--cn-line);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  /*
   * @todo No design-system capability publishes a listing row, so this row
   * states its flex layout locally.
   * Anchored at plans/debt/the-design-system-has-no-listing-row.md.
   */
  .reader-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--cn-gap);
  }

  .reader-link {
    flex: 1 1 auto;
    min-inline-size: 0;
  }
</style>

