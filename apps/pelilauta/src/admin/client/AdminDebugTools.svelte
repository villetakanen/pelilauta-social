<script lang="ts">
/**
 * The checks an administrator runs against the running service: whether an
 * authenticated server call reaches the API, whether an unauthenticated one is
 * refused, and whether an error reaches Sentry.
 *
 * v18 kept these in the administration tray, beside its navigation. They are
 * tools rather than places, so they stand on administration's front page.
 */
import CnIcon from '@design-system/components/CnIcon.svelte';
import SentryTestButton from '@pelilauta/components/svelte/admin/SentryTestButton.svelte';
import { authedPost } from 'src/firebase/client/apiClient';
import { pushSnack } from 'src/utils/client/snackUtils';
import { logDebug } from 'src/utils/logHelpers';

async function testSSRAuth() {
  const response = await authedPost('/api/bsky/skeet', {
    text: 'Hello world',
  });
  logDebug(`SSR Auth response: ${response.status}`);
  pushSnack(`SSR Auth status: ${response.status}`);
}

async function testSSRNoAuth() {
  const response = await fetch('/api/bsky/skeet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: 'Hello world!',
      linkUrl: 'https://pelilauta.social',
      linkTitle: 'Pelilauta',
      linkDescription: 'Pelilauta test post',
    }),
  });
  logDebug(`SSR No Auth response: ${response.status}`);
  pushSnack(`SSR No Auth status: ${response.status}`);
}
</script>

<div class="admin-tools-row">
  <button type="button" class="text" onclick={testSSRAuth}>
    <CnIcon noun="adventurer" decorative />
    <span>Test SSR Auth</span>
  </button>
  <button type="button" class="text" onclick={testSSRNoAuth}>
    <CnIcon noun="adventurer" decorative />
    <span>Test SSR No Auth</span>
  </button>
  <SentryTestButton />
</div>

<style>
  .admin-tools-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--cn-gap);
  }
</style>
