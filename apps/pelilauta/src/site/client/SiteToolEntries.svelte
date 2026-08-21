<script lang="ts">
/**
 * The entries of the site rail that depend on who is reading: the site player
 * tools, and the site owner tools. Both read the session, so both arrive after
 * the rail the server sent.
 *
 * Which tool shows, and how it behaves for a reader who does not hold the
 * role it needs, are `specs/pelilauta/site/site-rail/spec.md`'s; this
 * component states none of it.
 */
import CnIcon from '@design-system/components/CnIcon.svelte';
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import { uid } from '../../stores/session';

interface Props {
  site: Site;
  path: string;
}

const { site, path }: Props = $props();

const isOwner = $derived(site.owners.includes($uid));
const isPlayer = $derived(isOwner || Boolean(site.players?.includes($uid)));

function current(here: boolean) {
  return here ? 'page' : undefined;
}
</script>

{#if site.useHandouts}
  <a
    class="chrome-action"
    href={`/sites/${site.key}/handouts`}
    aria-current={current(isPlayer && path.startsWith(`/sites/${site.key}/handouts`))}
    aria-disabled={isPlayer ? undefined : 'true'}
    tabindex={isPlayer ? undefined : -1}
  >
    <CnIcon noun="hood" decorative />
    <span>{t('site:handouts.title')}</span>
  </a>
{/if}

{#if isOwner}
  <a
    class="chrome-action"
    href={`/sites/${site.key}/members`}
    aria-current={current(path === `/sites/${site.key}/members`)}
  >
    <CnIcon noun="adventurer" decorative />
    <span>{t('site:members.title')}</span>
  </a>

  <a
    class="chrome-action"
    href={`/sites/${site.key}/options`}
    aria-current={current(path === `/sites/${site.key}/options`)}
  >
    <CnIcon noun="gamepad" decorative />
    <span>{t('site:options.title')}</span>
  </a>

  <a
    class="chrome-action"
    href={`/sites/${site.key}/settings`}
    aria-current={current(path === `/sites/${site.key}/settings`)}
  >
    <CnIcon noun="tools" decorative />
    <span>{t('site:settings.title')}</span>
  </a>

  <a
    class="chrome-action"
    href={`/sites/${site.key}/data`}
    aria-current={current(path === `/sites/${site.key}/data`)}
  >
    <CnIcon noun="save" decorative />
    <span>{t('site:data.title')}</span>
  </a>
{/if}
