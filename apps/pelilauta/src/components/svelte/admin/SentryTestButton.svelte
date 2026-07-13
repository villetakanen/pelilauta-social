<script lang="ts">
import { captureError } from '@utils/client/sentry';
import { logDebug, logError } from '@utils/logHelpers';

// Component state
let feedback = $state<{ message: string; type: 'success' | 'error' } | null>(
  null,
);
let timeoutId: ReturnType<typeof setTimeout> | null = null;

async function handleTestError() {
  try {
    // Clear any existing feedback
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Create a test error with rich context
    const testError = new Error('This is a test error from SentryTestButton');

    const context = {
      component: 'SentryTestButton',
      action: 'test_sentry_integration',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    logDebug('SentryTestButton', 'Sending test error to Sentry', context);

    // Send error to Sentry
    await captureError(testError, context);

    // Show success feedback
    feedback = {
      message: 'Test error sent to Sentry successfully!',
      type: 'success',
    };

    logDebug('SentryTestButton', 'Test error sent successfully');
  } catch (error) {
    logError('SentryTestButton', 'Failed to send test error:', error);

    // Show error feedback
    feedback = {
      message: 'Failed to send test error to Sentry',
      type: 'error',
    };
  }

  // Auto-clear feedback after 3 seconds
  timeoutId = setTimeout(() => {
    feedback = null;
    timeoutId = null;
  }, 3000);
}
</script>

<button onclick={handleTestError}>
  <cn-icon noun="warning" small></cn-icon> Throw test error
</button>
{#if feedback}
  <div class="feedback {feedback.type}">
    {feedback.message}
  </div>
{/if}

<style>
.feedback {
  font-size: 0.75rem;
  padding: 0.25rem 0;
  margin-top: 0.25rem;
}

.feedback.success {
  color: var(--color-success);
}

.feedback.error {
  color: var(--color-error);
}
</style>
