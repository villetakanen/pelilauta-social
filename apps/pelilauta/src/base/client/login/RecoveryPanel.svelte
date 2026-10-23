<script lang="ts">
import { auth } from '@firebase/client';
import { logout } from 'src/stores/session/logout';
import { sessionManagerStarted } from 'src/stores/session/state';
import { navigateToDocument } from 'src/utils/client/documentNavigation';
import { beginCookieSession } from 'src/utils/client/sessionCookie';
import { t } from 'src/utils/i18n';
import { sanitizeRedirect } from 'src/utils/shared/sanitizeRedirect';
import type { Component } from 'svelte';
import { onMount } from 'svelte';
import EmailLoginSection from './EmailLoginSection.svelte';
import { createRecovery, type RecoveryState } from './recovery';
import SyndicatedLoginSection from './SyndicatedLoginSection.svelte';

type Props = {
  redirect: string;
  status: 401 | 500 | 503;
  showPassword?: boolean;
};
const { redirect, status, showPassword = false }: Props = $props();
let fragment = $state('');
const destination = $derived(sanitizeRedirect(redirect + fragment));
let state = $state<RecoveryState>('restoring');
let recovery: ReturnType<typeof createRecovery> | undefined;
let PasswordLogin = $state<Component<{ redirect?: string }> | undefined>();

onMount(() => {
  fragment = window.location.hash;
  // A view transition retains the previous document's authentication listener and subscriptions.
  if (sessionManagerStarted && window.self === window.top) {
    navigateToDocument(destination, true);
    return;
  }
  if (import.meta.env.DEV && showPassword) {
    void import('./PasswordLoginSection.svelte').then((module) => {
      PasswordLogin = module.default;
    });
  }
  if (status !== 401) return;
  let storage: Storage | undefined;
  try {
    storage = window.sessionStorage;
  } catch {}
  recovery = createRecovery({
    destination,
    storage,
    resolveUser: async () => {
      await auth.authStateReady();
      return auth.currentUser;
    },
    logout,
    navigate: (target) => navigateToDocument(target, true),
    report: (next) => {
      state = next;
    },
  });
  let initialized = false;
  const unsubscribe = auth.onAuthStateChanged((user) => {
    beginCookieSession(user?.uid ?? null);
    if (initialized && state !== 'failed' && state !== 'logoutIncomplete')
      recovery?.cancel();
    initialized = true;
  });
  // Astro's development router hydrates client-only islands in a hidden iframe before swapping.
  if (window.self === window.top) void recovery.attempt(true);
  else state = 'retry';
  return () => {
    unsubscribe();
    recovery?.dispose();
  };
});

function retry() {
  if (status === 401) void recovery?.attempt();
  else navigateToDocument(destination, true);
}
</script>

<section class="surface" aria-labelledby="recovery-title" data-protected-recovery={status}>
  <h2 id="recovery-title">{t('login:recovery.title')}</h2>
  <p role="status" aria-live="polite">
    {t(`login:recovery.${status === 503 ? 'unavailable' : status === 500 ? 'failed' : state}`)}
  </p>
  <button type="button" onclick={retry}>{t('login:recovery.retryAction')}</button>
</section>
<div onsubmitcapture={() => recovery?.cancel()}>
  {#if PasswordLogin}
    <PasswordLogin redirect={destination} />
  {/if}
  <EmailLoginSection redirect={destination} autoComplete={status === 401} />
  <SyndicatedLoginSection redirect={destination} />
</div>
