<script lang="ts">
// Import utilities, stores, and lifecycle functions

import { FirebaseError } from 'firebase/app';
import { completeAuthFlow } from 'src/utils/client/authUtils';
import { captureError } from 'src/utils/client/sentry';
import { pushSessionSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';
import { onMount } from 'svelte';

interface Props {
  redirect?: string;
}
const { redirect = '/' }: Props = $props();

// Component state using Svelte runes
type View = 'send' | 'sent' | 'verifyWithEmail';
let view = $state<View>('send');
let email = $state('');
let suspend = $state(false); // Indicates an operation is in progress (sending link or verifying)

/**
 * Verifies the sign-in link when the user returns to the app.
 * Dynamically imports Firebase Auth functions.
 */
const verifyLink = async (emailToUse?: string) => {
  suspend = true; // Indicate verification is in progress
  logDebug('EmailLoginSection', 'Starting email link verification...');

  try {
    // Dynamically import Firebase Auth functions and instance
    const { signInWithEmailLink } = await import('firebase/auth');
    const { auth } = await import('../../../firebase/client');

    let emailFromStorage = '';
    let loginRedirectRoute = '';

    try {
      emailFromStorage = window.localStorage.getItem('emailForSignIn') || '';
      loginRedirectRoute =
        window.localStorage.getItem('loginRedirectRoute') || '';
    } catch (e) {
      logWarn('EmailLoginSection', 'Failed to access localStorage', e);
    }

    // Use provided email, storage email, or component state email as fallback
    const emailForVerification = emailToUse || emailFromStorage || email;

    logDebug('EmailLoginSection', 'Retrieved from storage:', {
      emailFromStorage,
      loginRedirectRoute,
      emailToUse,
      emailForVerification,
    });

    if (!emailForVerification) {
      logError(
        'EmailLoginSection',
        'No email available for verification - requesting user input.',
      );
      // Instead of aborting, ask user to enter their email
      view = 'verifyWithEmail';
      suspend = false;
      return;
    }

    logDebug('EmailLoginSection', 'Attempting to sign in with email link...');
    logDebug('EmailLoginSection', 'Email:', emailForVerification);
    logDebug('EmailLoginSection', 'URL:', window.location.href);

    const userCredential = await signInWithEmailLink(
      auth,
      emailForVerification,
      window.location.href,
    );

    logDebug('EmailLoginSection', 'Sign in successful:', userCredential.user);

    // Clear email from storage on success
    try {
      window.localStorage.removeItem('emailForSignIn');
      window.localStorage.removeItem('loginRedirectRoute'); // Also clear redirect route
    } catch (e) {
      logWarn('EmailLoginSection', 'Failed to clear localStorage', e);
    }

    // Complete the authentication flow (save session + redirect)
    await completeAuthFlow(userCredential.user, loginRedirectRoute || redirect);
    // No need to set suspend = false due to redirect
  } catch (error) {
    logError('EmailLoginSection', 'Error verifying email link:', error);

    // Expected auth errors that don't need Sentry logging
    const expectedErrors = [
      'auth/invalid-action-code',
      'auth/expired-action-code',
      'auth/invalid-email',
    ];

    const errorCode = error instanceof FirebaseError ? error.code : '';
    const isExpectedError = expectedErrors.some(
      (code) =>
        errorCode.includes(code) ||
        (error instanceof Error && error.message.includes(code)),
    );

    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('auth/invalid-action-code')) {
        pushSessionSnack(
          'The email link has expired or been used already. Please request a new one.',
          {
            type: 'error',
          },
        );
      } else if (error.message.includes('auth/invalid-email')) {
        pushSessionSnack('Invalid email address. Please try again.', {
          type: 'error',
        });
        // Ask user to re-enter email
        view = 'verifyWithEmail';
      } else {
        // Log unexpected errors to Sentry
        if (!isExpectedError) {
          captureError(error, {
            component: 'EmailLoginSection',
            action: 'verifyLink',
            errorCode,
          });
        }
        pushSessionSnack(`Error: ${error.message}`, {
          type: 'error',
        });
      }
    } else {
      // Non-Error object - log to Sentry
      captureError(error as Error, {
        component: 'EmailLoginSection',
        action: 'verifyLink',
        errorType: 'non-error-object',
      });
      pushSessionSnack(t('login:error.linkVerificationFailed'), {
        type: 'error',
      }); // User feedback
    }

    suspend = false; // Reset suspend state on error
  }
};

/**
 * Handles verification when user needs to re-enter email for the link
 */
const verifyWithEmail = async (e: SubmitEvent) => {
  e.preventDefault();
  if (!email) {
    pushSessionSnack(t('login:error.emailRequired'), { type: 'error' });
    return;
  }

  view = 'send';
  await verifyLink(email);
};

/**
 * Sends the sign-in link to the provided email address.
 * Dynamically imports Firebase Auth functions.
 */
const sendLink = async (e: SubmitEvent) => {
  e.preventDefault();
  if (!email) {
    pushSessionSnack(t('login:error.emailRequired'), { type: 'error' });
    return;
  }
  suspend = true;

  // Define action code settings here to capture current URL
  const actionCodeSettings = {
    url: window.location.origin + window.location.pathname, // Avoid query params in redirect
    handleCodeInApp: true,
  };

  logDebug(
    'EmailLoginSection',
    'Sending email link with settings:',
    actionCodeSettings,
  );

  try {
    // Dynamically import Firebase Auth functions and instance
    const { sendSignInLinkToEmail } = await import('firebase/auth');
    const { auth } = await import('../../../firebase/client');

    logDebug('EmailLoginSection', 'Storing email in localStorage:', email);
    try {
      window.localStorage.setItem('emailForSignIn', email);
      // Optionally store the intended redirect route if needed after login
      if (redirect) {
        window.localStorage.setItem('loginRedirectRoute', redirect);
      }
    } catch (e) {
      logWarn('EmailLoginSection', 'Failed to write to localStorage', e);
    }

    logDebug('EmailLoginSection', 'Sending sign-in link to email:', email);
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    logDebug('EmailLoginSection', 'Email link sent successfully');

    // Inform the user to check their email
    view = 'sent';
    pushSessionSnack(t('login:withEmail.sent')); // Success feedback
  } catch (error) {
    logError('EmailLoginSection', 'Error sending email link:', error);

    // Expected errors that don't need Sentry logging
    const expectedErrors = ['auth/invalid-email', 'auth/missing-email'];

    const errorCode = error instanceof FirebaseError ? error.code : '';
    const isExpectedError = expectedErrors.includes(errorCode);

    // Log unexpected errors to Sentry
    if (!isExpectedError) {
      captureError(error as Error, {
        component: 'EmailLoginSection',
        action: 'sendLink',
        errorCode,
      });
    }

    // Provide more specific error messages
    if (error instanceof Error) {
      pushSessionSnack(`Error sending email: ${error.message}`, {
        type: 'error',
      });
    } else {
      pushSessionSnack(t('login:error.sendLinkFailed'), { type: 'error' });
    }

    view = 'send'; // Reset sent state on error
  } finally {
    suspend = false; // Ensure suspend state is reset
  }
  email = ''; // Clear email input after sending the link
};

// Check for sign-in link on component mount
onMount(async () => {
  try {
    // Dynamically import Firebase Auth functions and instance
    const { isSignInWithEmailLink } = await import('firebase/auth');
    const { auth } = await import('../../../firebase/client');

    if (isSignInWithEmailLink(auth, window.location.href)) {
      logDebug('EmailLoginSection', 'Verifying email link...');
      verifyLink();
    }
  } catch (error) {
    logError('EmailLoginSection', 'Error in onMount:', error);
    captureError(error as Error, {
      component: 'EmailLoginSection',
      action: 'onMount',
    });
  }
});
</script>

<section class="elevation-1 border-radius p-2" style="position: relative">
  <h2>{t("login:withEmail.title")}</h2>

  {#if view === "sent"}
    <p>{t("login:withEmail.sent")}</p>
  {:else if view === "verifyWithEmail"}
    <!-- User needs to re-enter email for link verification -->
    <p>Please enter the email address you used to request the login link:</p>
    <form onsubmit={verifyWithEmail}>
      <div class="form-field">
        <label for="email-verify">{t("login:withEmail.label")}</label>
        <input
          id="email-verify"
          type="email"
          placeholder={t("login:withEmail.placeholder")}
          bind:value={email}
          required
        />
      </div>
      <div class="toolbar justify-end">
        <button type="submit" disabled={suspend}>
          {#if suspend}
            <cn-loader></cn-loader>
          {/if}
          <span>Verify Login Link</span>
        </button>
      </div>
    </form>
  {:else}
    <p>{t("login:withEmail.info")}</p>
    <form onsubmit={sendLink}>
      <div class="form-field">
        <label for="email-login">{t("login:withEmail.label")}</label>
        <input
          id="email-login"
          type="email"
          placeholder={t("login:withEmail.placeholder")}
          bind:value={email}
          required
        />
      </div>
      <div class="toolbar justify-end">
        <button type="submit" disabled={suspend}>
          {#if suspend}
            <cn-loader></cn-loader>
          {:else}
            <cn-icon noun="send"></cn-icon>
          {/if}
          <span>{t("login:withEmail.sendAction")}</span>
        </button>
      </div>
    </form>
  {/if}
</section>
