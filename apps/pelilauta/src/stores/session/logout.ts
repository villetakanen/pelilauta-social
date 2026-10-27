import { auth } from '@firebase/client';
import { pushSessionSnack } from '@utils/client/snackUtils';
import { logDebug, logError, logWarn } from '@utils/logHelpers';
import {
  blockCookieSynchronization,
  resumeCookieSynchronization,
} from 'src/utils/client/sessionCookie';
import { reset as unsubscribeFromAccount } from './account';
import { unsubscribeFromProfile } from './profile';
import { sessionState, uid } from './state';
import { resetSubscriberStore } from './subscriber';

let logoutInProgress: Promise<boolean> | undefined;

export function logout(): Promise<boolean> {
  if (!logoutInProgress) {
    logoutInProgress = runLogout().finally(() => {
      resumeCookieSynchronization();
      logoutInProgress = undefined;
    });
  }
  return logoutInProgress;
}

async function runLogout(): Promise<boolean> {
  sessionState.set('loading');
  try {
    await blockCookieSynchronization();
    const response = await fetch('/api/auth/session', { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`Session cookie deletion failed: ${response.status}`);
    }
    uid.set('');
    resetSubscriberStore();
    unsubscribeFromAccount();
    unsubscribeFromProfile();
    await auth.signOut();
  } catch (error) {
    logError('sessionStore', 'logout', 'Logout did not complete', error);
    sessionState.set('error');
    try {
      pushSessionSnack('snack:session.logoutIncomplete');
    } catch (snackError) {
      logWarn('sessionStore', 'logout', 'Could not notify reader', snackError);
    }
    return false;
  }
  sessionState.set('initial');
  logDebug('sessionStore', 'logout', 'Logout complete');
  return true;
}
