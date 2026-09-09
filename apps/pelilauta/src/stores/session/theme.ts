import { uid } from '@stores/session';
import { account } from '@stores/session/account';
import { updateAccount } from 'src/firebase/client/account/updateAccount';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';

/*
 * A failed write reverts to the last confirmed theme, the account as it stood
 * before the flip, on the document and in the atom, and reports through the
 * snackbar. A member who flips again while a write is in flight owns the
 * state: only the latest flip may revert, which is what the sequence guards.
 */
let flips = 0;

/**
 * Persists a theme flip. The bar's switch and the settings toggle both call
 * this, so a flip in either reaches the other through the account atom.
 *
 * Sets the document root's `color-scheme`, sets the account atom that
 * `ThemeScript.astro` reads before first paint, and writes `lightMode` to the
 * account document. Does nothing without a signed-in account.
 */
export async function setTheme(mode: 'light' | 'dark'): Promise<void> {
  const confirmed = account.get();
  if (!confirmed || !uid.get()) return;
  const flip = ++flips;
  document.documentElement.style.colorScheme = mode;
  account.set({ ...confirmed, lightMode: mode });
  try {
    await updateAccount({ lightMode: mode }, uid.get());
  } catch {
    if (flip !== flips) return;
    account.set(confirmed);
    document.documentElement.style.colorScheme =
      confirmed.lightMode === 'light' || confirmed.lightMode === 'dark'
        ? confirmed.lightMode
        : '';
    pushSnack(t('app:errors.themeNotSaved'));
  }
}
