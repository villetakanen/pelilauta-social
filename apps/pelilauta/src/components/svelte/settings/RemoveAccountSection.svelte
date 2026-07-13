<script lang="ts">
// Import stores, utilities, and i18n function

import { pushSessionSnack, pushSnack } from 'src/utils/client/snackUtils'; // For user feedback
import { t } from 'src/utils/i18n';
import { logWarn } from 'src/utils/logHelpers';
import { uid } from '../../../stores/session'; // $uid is used directly

// No props needed for this component
// interface Props {}
// const {}: Props = $props();

// Component state using Svelte runes
let showVerify = $state(false);
let verifyText = $state(''); // Renamed from 'verify' to avoid conflict with potential function names
let loading = $state(false); // For UX feedback during de-registration

// No derived state needed for this component
// const derivedVar = $derived.by(() => {return value})

/**
 * Handles the de-registration process.
 * Dynamically imports Firebase functions and the logout utility.
 */
async function deRegister(e: SubmitEvent) {
  // Changed type to SubmitEvent for form submission
  e.preventDefault();
  loading = true;

  // Double-check the verification text, though the button should be disabled
  if (verifyText !== 'olen aivan varma') {
    pushSessionSnack(
      t('settings:profile.dangerZone.error.confirmationMismatch'),
      { type: 'error' },
    );
    loading = false;
    return;
  }

  logWarn('Removing user data from the platform, this cannot be undone');

  const key = $uid; // Access $uid directly
  if (!key) {
    logWarn('User ID not found, cannot de-register.');
    pushSessionSnack(t('common:error.generic'), { type: 'error' });
    loading = false;
    return;
  }

  try {
    // Dynamically import Firebase Firestore functions and db instance
    const { deleteDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../../../firebase/client'); // Corrected path as per instructions

    await deleteDoc(doc(db, 'profiles', key));
    logWarn('Profile removed from the DB');

    await deleteDoc(doc(db, 'account', key));
    logWarn('Account removed from the DB');

    // Dynamically import and call logout
    const { logout: sessionLogout } = await import('../../../stores/session');
    await sessionLogout();

    verifyText = ''; // Reset verification text
    showVerify = false; // Hide the verification form

    pushSessionSnack(t('settings:profile.dangerZone.success')); // Success feedback
    window.location.href = '/'; // Redirect after successful de-registration
  } catch (error) {
    logWarn('Error during de-registration:', error);
    pushSnack(t('settings:profile.dangerZone.error.generic'));
    loading = false; // Reset loading state on error
  }
}
</script>
  
  <section class="elevation-1 p-2 my-1">
    <h4>{t('settings:profile.dangerZone.title')}</h4>
    <p>{t('settings:profile.dangerZone.info')}</p>
    <button type="button" class="text" onclick={() => showVerify = true} disabled={showVerify}>
      {t('actions:deregister')}
    </button>
  
    {#if showVerify}
      <form onsubmit={deRegister} class="elevation-2 p-2 mt-1 border-radius">
        <div class="form-field">
          <label for="deregister-confirm">
            {t('settings:profile.dangerZone.confirm')}
          </label>
          <input
            id="deregister-confirm"
            type="text"
            bind:value={verifyText} 
            placeholder="olen aivan varma" 
          />
        </div>
        <div class="toolbar flex justify-end">
          <button
            disabled={verifyText !== 'olen aivan varma' || loading}
            type="submit"
            class="cta"
          >
            {#if loading}
              <cn-loader></cn-loader>
            {:else}
              <cn-icon noun="check"></cn-icon>
            {/if}
            <span>{t('actions:confirm.delete')}</span>
          </button>
        </div>
      </form>
    {/if}
  </section>
  