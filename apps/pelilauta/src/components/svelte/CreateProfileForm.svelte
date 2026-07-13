<script lang="ts">
import { logDebug } from '@utils/logHelpers';

let nick = '';
let bio = '';

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
    // Handle error
  }
}
</script>

<form on:submit={handleSubmit}>
  <div class="form-group">
    <label for="nick">Nickname</label>
    <input type="text" id="nick" bind:value={nick} required />
  </div>
  <div class="form-group">
    <label for="bio">Bio</label>
    <textarea id="bio" bind:value={bio}></textarea>
  </div>
  <div class="pt-4">
    <button type="submit" class="cyan-button primary">Save Profile</button>
  </div>
</form>
