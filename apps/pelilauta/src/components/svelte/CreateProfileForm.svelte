<script lang="ts">
import { logDebug } from '@utils/logHelpers';
import { t } from 'src/utils/i18n';

let nick = $state('');
let bio = $state('');

async function handleSubmit(event: Event) {
  event.preventDefault();
  logDebug('CreateProfileForm', 'Submitting profile', { nick, bio });

  const response = await fetch('/api/onboarding/complete-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nick, bio }),
  });

  if (response.ok) {
    logDebug('CreateProfileForm', 'Profile created, redirecting to home');
    window.location.href = '/';
  } else {
    logDebug('CreateProfileForm', 'Profile creation failed', response);
  }
}
</script>

<form onsubmit={handleSubmit} class="surface profile-form">
  <label>
    {t('entries:profile.nick')}
    <input type="text" bind:value={nick} required />
  </label>
  <label>
    {t('entries:profile.bio')}
    <textarea bind:value={bio}></textarea>
  </label>
  <div class="text-end">
    <button type="submit">{t('actions:save')}</button>
  </div>
</form>

<style>
  /*
   * .surface publishes padding and containment only, so this form states
   * the interval between its own field blocks.
   */
  .profile-form {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>
