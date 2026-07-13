<script lang="ts">
import { authedPost } from 'src/firebase/client/apiClient';
import { appMeta } from 'src/stores/metaStore/metaStore';
import { pushSnack } from 'src/utils/client/snackUtils';
import { uid } from '../../../stores/session';
import WithAuth from '../app/WithAuth.svelte';

const visible = $derived.by(() => $appMeta.admins.includes($uid));

async function onsubmit(event: Event) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  const text = formData.get('text') as string;
  const linkUrl = formData.get('linkUrl') as string;
  const linkTitle = formData.get('linkTitle') as string;
  const linkDescription = formData.get('linkDescription') as string;

  const response = await authedPost('/api/bsky/skeet', {
    text,
    linkUrl,
    linkTitle,
    linkDescription,
  });
  pushSnack(`Social media post status: ${response.status}`);
}
</script>

<WithAuth allow={visible}>
  <div class="content-columns">
    <section>
      <h2>New message</h2>
      <p class="downscaled">This form sends a social media post to supported syndicate accounts (Bluesky for now) as "Pelilauta.social"</p>
      <form {onsubmit}>
        <label for="text">Message
          <textarea name="text" id="text" required maxlength="220"></textarea>
        </label>
        <label for="linkUrl">Link URL
          <input type="url" name="linkUrl" id="linkUrl" />
        </label>
        <label for="linkTitle">Link title
          <input type="text" name="linkTitle" id="linkTitle" />
        </label>
        <label for="linkDescription">Link description
          <input type="text" name="linkDescription" id="linkDescription" />
        </label>
        <button type="submit" class="cn-button">Send</button>
      </form>
    </section>
  </div>
</WithAuth>