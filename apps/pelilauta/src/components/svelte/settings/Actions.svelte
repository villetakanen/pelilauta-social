<script lang="ts">
import CnToggle from '@design-system/components/CnToggle.svelte';
import { account } from '@stores/session/account';
import { setTheme } from '@stores/session/theme';
import { t } from 'src/utils/i18n';
import { logout } from '../../../stores/session';

let prefersLight = $state(false);

$effect(() => {
  prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
});

const checked = $derived.by(() => {
  const lightMode = $account?.lightMode;
  if (lightMode === 'light') return true;
  if (lightMode === 'dark') return false;
  return prefersLight;
});

function onThemeChange(
  event: Event & { currentTarget: EventTarget & HTMLInputElement },
) {
  setTheme(event.currentTarget.checked ? 'light' : 'dark');
}

async function logoutAction() {
  await logout();
  window.location.href = '/';
}
</script>

<section class="surface">
  <h3>{t('settings:actions.title')}</h3>
  <CnToggle
    label={t('settings:actions.theme')}
    {checked}
    onchange={onThemeChange}
  />
  <div class="actions justify-end">
    <button class="button" type="button" onclick={logoutAction}>
      {t('actions:logout')}
    </button>
  </div>
</section>

<style>
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>
