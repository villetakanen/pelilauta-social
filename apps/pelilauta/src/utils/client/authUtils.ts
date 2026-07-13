import type { User } from 'firebase/auth';
import { captureError } from 'src/utils/client/sentry';
import { logError } from 'src/utils/logHelpers';

/**
 * Completes the authentication flow by saving the session cookie and redirecting.
 *
 * @param user - Firebase user object
 * @param redirectPath - Path to redirect to after successful authentication (default: '/')
 */
export async function completeAuthFlow(user: User, redirectPath = '/') {
  try {
    // Get the ID token from the user
    const idToken = await user.getIdToken();

    // Send the token to the server to create a session cookie
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
    });

    // Check if session creation failed
    if (!response.ok) {
      const errorText = await response.text();
      const sessionError = new Error(
        `Session creation failed: ${response.status} ${errorText}`,
      );

      // Log to Sentry - this is an unexpected server-side error
      captureError(sessionError, {
        component: 'completeAuthFlow',
        action: 'createSession',
        statusCode: response.status,
        responseText: errorText,
      });

      throw sessionError;
    }

    // Dynamically import client utilities
    const { pushSessionSnack } = await import('./snackUtils');
    const { t } = await import('src/utils/i18n');

    pushSessionSnack(t('login:snacks.success'));

    // Redirect on successful authentication
    window.location.assign(redirectPath);
  } catch (error) {
    logError(
      'completeAuthFlow',
      'Failed to complete authentication flow:',
      error,
    );

    // Log to Sentry if not already logged
    if (
      error instanceof Error &&
      !error.message.includes('Session creation failed')
    ) {
      captureError(error, {
        component: 'completeAuthFlow',
        action: 'authFlow',
      });
    }

    throw error; // Re-throw so calling code can handle the error
  }
}
