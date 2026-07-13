/**
 * Client-side Sentry initialization
 *
 * This is a manual initialization to avoid conflicts with edge functions
 * that run on Deno and don't support Node.js modules.
 */

import type { ErrorEvent, EventHint } from '@sentry/browser';

let sentryInitialized = false;

export async function initSentry() {
  // Only run in browser and production
  if (
    typeof window === 'undefined' ||
    import.meta.env.DEV ||
    sentryInitialized
  ) {
    return;
  }

  try {
    const { init, setTag, setContext } = await import('@sentry/browser');

    init({
      dsn: 'https://1fcabaabfe76dd246dea76e7e30b6ede@o4509229934968832.ingest.de.sentry.io/4509229941719120',
      environment: import.meta.env.MODE,

      // Performance monitoring - disabled for now
      tracesSampleRate: 0,

      // Session replays - disabled for now
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,

      // Privacy settings
      sendDefaultPii: false,

      // Integration settings
      integrations: [
        // Only include browser-compatible integrations
      ],

      // Additional options
      beforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
        // Filter out unwanted errors if needed
        return event;
      },
    });

    // Set additional context
    setTag('app.component', 'client');
    setContext('browser', {
      userAgent: navigator.userAgent,
      language: navigator.language,
    });

    sentryInitialized = true;
    console.debug('[Sentry] Client-side initialization complete');
  } catch (error) {
    console.warn('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Capture an error manually
 */
export async function captureError(
  error: Error,
  context?: Record<string, unknown>,
) {
  if (!sentryInitialized) {
    console.error('Error (Sentry not initialized):', error, context);
    return;
  }

  try {
    const { captureException, withScope } = await import('@sentry/browser');

    withScope((scope) => {
      if (context) {
        scope.setContext('additional', context);
      }
      captureException(error);
    });
  } catch (sentryError) {
    console.error('Failed to capture error with Sentry:', sentryError);
    console.error('Original error:', error, context);
  }
}

/**
 * Capture a message manually
 */
export async function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
) {
  if (!sentryInitialized) {
    console.log(`Message (Sentry not initialized) [${level}]:`, message);
    return;
  }

  try {
    const { captureMessage: sentryCaptureMessage } = await import(
      '@sentry/browser'
    );
    sentryCaptureMessage(message, level);
  } catch (error) {
    console.error('Failed to capture message with Sentry:', error);
    console.log(`Original message [${level}]:`, message);
  }
}
