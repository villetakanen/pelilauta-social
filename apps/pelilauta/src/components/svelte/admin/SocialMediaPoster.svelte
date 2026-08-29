<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import { authedPost } from 'src/firebase/client/apiClient';
import { appMeta } from 'src/stores/metaStore/metaStore';
import { pushSnack } from 'src/utils/client/snackUtils';
import { uid } from '../../../stores/session';
import WithAuth from '../app/WithAuth.svelte';

const visible = $derived.by(() => $appMeta.admins.includes($uid));
let isSending = $state(false);

async function onsubmit(event: Event) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  const text = formData.get('text') as string;
  const linkUrl = formData.get('linkUrl') as string;
  const linkTitle = formData.get('linkTitle') as string;
  const linkDescription = formData.get('linkDescription') as string;

  isSending = true;
  try {
    const response = await authedPost('/api/bsky/skeet', {
      text,
      linkUrl,
      linkTitle,
      linkDescription,
    });
    pushSnack(`Social media post status: ${response.status}`);
    if (response.ok) {
      form.reset();
    }
  } finally {
    isSending = false;
  }
}
</script>

<WithAuth allow={visible}>
  <article class="surface social-poster-card">
    <header>
      <h2>New message</h2>
      <p class="text-small text-low">
        This form sends a social media post to supported syndicate accounts (Bluesky for now) as "Pelilauta.social"
      </p>
    </header>

    <form {onsubmit} class="social-poster-form">
      <label>
        Message *
        <textarea name="text" required maxlength="220" rows="4" disabled={isSending}></textarea>
      </label>

      <label>
        Link URL
        <input type="url" name="linkUrl" placeholder="https://..." disabled={isSending} />
      </label>

      <label>
        Link title
        <input type="text" name="linkTitle" disabled={isSending} />
      </label>

      <label>
        Link description
        <input type="text" name="linkDescription" disabled={isSending} />
      </label>

      <div class="actions">
        <button type="submit" disabled={isSending}>
          {#if isSending}
            <CnLoader inline />
          {:else}
            <CnIcon noun="send" />
          {/if}
          <span>Send</span>
        </button>
      </div>
    </form>
  </article>
</WithAuth>

<style>
  .social-poster-card {
    display: grid;
    row-gap: var(--cn-line);
  }

  .social-poster-form {
    display: grid;
    row-gap: var(--cn-line);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
</style>