<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import { authedPost } from 'src/firebase/client/apiClient';
import { appMeta } from 'src/stores/metaStore/metaStore';
import { logDebug } from 'src/utils/logHelpers';
import { uid } from '../../../stores/session';
import WithAuth from '../app/WithAuth.svelte';
import SentryTestButton from './SentryTestButton.svelte';

const visible = $derived.by(() => $appMeta.admins.includes($uid));

async function testSSRAuth() {
  const response = await authedPost('/api/bsky/skeet', {
    text: 'Hello world',
  });
  logDebug(`SSR Auth response: ${response.status}`);
}
async function testSSRNoAuth() {
  /* json is 
  text,
  linkUrl,
  linkTitle,
  linkDescription, */
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
  logDebug(`SSR Auth response: ${response.status}`);
}
</script>

<WithAuth allow={visible}>
  <h3>Admin Tools</h3>
  <p class="text-caption pb-1 pt-1">
    Administrative tools for managing forum channels, content, and system settings.
  </p>
  <ul>
    <li>
      <a href="/admin/channels">
        <Icon noun="discussion" size="small" /> Forum Administration
      </a>
    </li>
    <li>
      <a href="/admin/messaging">
        <Icon noun="send" size="small" /> Social Media Poster
      </a>
    </li>
    <li>
      <a href="/admin/users">
        <Icon noun="adventurer" size="small" /> User Management
      </a>
    </li>
    <li>
      <a href="/admin/sheets">
        <Icon noun="adventurer" size="small" /> Character Sheets
      </a>
    </li>
    <li>
      <a href="/admin/sites">
        <Icon noun="mekanismi" size="small" /> Site Activity
      </a>
    </li>
    <li>
      <a href="/admin/snackbar-test">
        <Icon noun="info" size="small" /> Snackbar Test
      </a>
    </li>
    <li>
      <button onclick={testSSRAuth}>
        <Icon noun="adventurer" /> Test SSR Auth
      </button>
    </li>
    <li>
      <button onclick={testSSRNoAuth}>
        <Icon noun="adventurer" /> Test SSR No Auth
      </button>
    </li>
    <li>
      <SentryTestButton />
    </li>
  </ul>
</WithAuth>
