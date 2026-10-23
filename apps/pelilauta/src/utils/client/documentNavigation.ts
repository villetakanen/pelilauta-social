import { sanitizeRedirect } from 'src/utils/shared/sanitizeRedirect';

export function navigateToDocument(destination: string, replace = false): void {
  const target = sanitizeRedirect(destination);
  // A fragment navigation to the recovery address does not request a new document.
  if (
    window.location.href &&
    new URL(target, window.location.href).href === window.location.href
  ) {
    window.location.reload();
  } else if (replace) {
    window.location.replace(target);
  } else {
    window.location.assign(target);
  }
}
