<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { captureError } from '@utils/client/sentry';
import { pushSnack } from '@utils/client/snackUtils';
import { logDebug, logError } from '@utils/logHelpers';

async function handleTestError() {
  try {
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
    pushSnack('Test error sent to Sentry successfully!');
    logDebug('SentryTestButton', 'Test error sent successfully');
  } catch (error) {
    logError('SentryTestButton', 'Failed to send test error:', error);
    pushSnack('Failed to send test error to Sentry');
  }
}
</script>

<button type="button" class="text" onclick={handleTestError}>
  <CnIcon noun="warning" />
  <span>Throw test error</span>
</button>
