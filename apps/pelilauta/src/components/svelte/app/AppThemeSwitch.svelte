<script lang="ts">
import CnThemeSwitch from '@design-system/components/CnThemeSwitch.svelte';
import { uid } from '@stores/session';
import { account } from '@stores/session/account';
import { updateAccount } from 'src/firebase/client/account/updateAccount';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';

/**
 * The theme switch as Pelilauta mounts it: signed-in readers only, because the
 * theme is the account's `lightMode`. An account-less reader gets no control —
 * the document keeps `color-scheme: dark light` and the browser's preference
 * resolves it.
 *
 * CnThemeSwitch writes the root's colorScheme itself and announces it with a
 * bubbling `cn-theme-change`; this wrapper hears it, mirrors the mode into the
 * account atom — which persists it to localStorage for ThemeScript.astro's next
 * pre-paint read — and writes it to the account document.
 */
interface Props {
  /** The control's accessible name. */
  label: string;
}
const { label }: Props = $props();

let host: HTMLElement | undefined = $state();

/*
 * A failed write reverts to the last confirmed theme — the account as it stood
 * before the flip — on the document and in the atom, and reports through the
 * snackbar. A reader who flips again while a write is in flight owns the
 * state: only the latest flip may revert, which is what the sequence guards.
 */
let flips = 0;

const persist = async () => {
  const mode = document.documentElement.style.colorScheme;
  if (mode !== 'light' && mode !== 'dark') return;
  const confirmed = account.get();
  if (!confirmed || !uid.get()) return;
  const flip = ++flips;
  account.set({ ...confirmed, lightMode: mode });
  try {
    await updateAccount({ lightMode: mode }, uid.get());
  } catch {
    if (flip !== flips) return;
    account.set(confirmed);
    document.documentElement.style.colorScheme =
      confirmed.lightMode === 'light' || confirmed.lightMode === 'dark'
        ? confirmed.lightMode
        : '';
    pushSnack(t('app:errors.themeNotSaved'));
  }
};

$effect(() => {
  if (!host) return;
  host.addEventListener('cn-theme-change', persist);
  return () => host?.removeEventListener('cn-theme-change', persist);
});
</script>

{#if $account}
  <span bind:this={host} style="display: contents">
    <CnThemeSwitch {label} />
  </span>
{/if}
