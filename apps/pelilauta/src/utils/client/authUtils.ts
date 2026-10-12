import type { User } from 'firebase/auth';
import { captureError } from 'src/utils/client/sentry';
import { logError } from 'src/utils/logHelpers';
import { beginCookieSession, synchronizeSessionCookie } from './sessionCookie';

export async function completeAuthFlow(user: User, redirectPath = '/') {
  const current = beginCookieSession(user.uid);
  try {
    const response = await synchronizeSessionCookie(user, current);
    if (!current()) return;

    if (!response.ok) {
      const errorText = await response.text();
      if (!current()) return;
      const sessionError = new Error(
        `Session creation failed: ${response.status} ${errorText}`,
      );

      captureError(sessionError, {
        component: 'completeAuthFlow',
        action: 'createSession',
        statusCode: response.status,
        responseText: errorText,
      });

      throw sessionError;
    }

    const { pushSessionSnack } = await import('./snackUtils');
    const { t } = await import('src/utils/i18n');

    if (!current()) return;
    try {
      localStorage.setItem('session-uid', user.uid);
      localStorage.setItem('session-state', 'active');
    } catch {}

    pushSessionSnack(t('login:snacks.success'));

    window.location.assign(redirectPath);
  } catch (error) {
    if (!current()) return;
    logError(
      'completeAuthFlow',
      'Failed to complete authentication flow:',
      error,
    );

    if (
      error instanceof Error &&
      !error.message.includes('Session creation failed')
    ) {
      captureError(error, {
        component: 'completeAuthFlow',
        action: 'authFlow',
      });
    }

    throw error;
  }
}
