import { pushSnack } from './snackUtils';

let idbErrorHandlerInitialized = false;

/**
 * Initialize the IndexedDB error handler.
 * This handler listens for the specific "Connection to Indexed Database server lost" error
 * and reloads the page to attempt reconnection.
 */
export function initIDBErrorHandler() {
  // Only run in browser
  if (typeof window === 'undefined' || idbErrorHandlerInitialized) {
    return;
  }

  const handleIDBError = (event: ErrorEvent | PromiseRejectionEvent) => {
    const error = event instanceof ErrorEvent ? event.error : event.reason;

    if (!error) return;

    const errorMessage = error.message || error.toString();

    // Check for the specific error message
    // "UnknownError: Connection to Indexed Database server lost. Refresh the page to try again"
    if (
      errorMessage &&
      (errorMessage.includes('Connection to Indexed Database server lost') ||
        errorMessage.includes('Indexed Database server lost'))
    ) {
      console.warn(
        '[IDB Error Handler] Caught IndexedDB connection loss:',
        error,
      );

      // Show feedback to the user
      pushSnack({
        message: '✗ Database connection lost. Reloading...',
      });

      // Reload the page after a short delay to allow the user to see the message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  window.addEventListener('error', handleIDBError);
  window.addEventListener('unhandledrejection', handleIDBError);

  idbErrorHandlerInitialized = true;
  console.debug('[IDB Error Handler] Initialized');
}
