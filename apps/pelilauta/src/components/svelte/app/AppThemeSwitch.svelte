<script lang="ts">
import CnThemeSwitch from '@design-system/components/CnThemeSwitch.svelte';
import { uid } from '@stores/session';
import { account } from '@stores/session/account';
import { updateAccount } from 'src/firebase/client/account/updateAccount';

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

const persist = () => {
  const mode = document.documentElement.style.colorScheme;
  if (mode !== 'light' && mode !== 'dark') return;
  const current = account.get();
  if (!current || !uid.get()) return;
  account.set({ ...current, lightMode: mode });
  updateAccount({ lightMode: mode }, uid.get());
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
