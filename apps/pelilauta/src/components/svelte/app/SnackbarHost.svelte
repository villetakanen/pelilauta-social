<script lang="ts">
/**
 * SnackbarHost — the one place a layout presents application feedback.
 *
 * It presents the first report in the queue and releases it when CnSnackbar
 * says the reader is done with it, which is what makes the queue advance one
 * report at a time rather than overwriting.
 *
 * It also collects the hand-off an operation left before navigating away, on
 * mount rather than on load: the report belongs in the queue only once there is
 * something able to present it.
 *
 * `specs/pelilauta/application-feedback/spec.md` states the behaviour.
 */
import CnSnackbar from '@design-system/components/CnSnackbar.svelte';
import {
  dismissSnack,
  snacks,
  takeSessionSnack,
} from '@utils/client/snackUtils';
import { onMount } from 'svelte';

const current = $derived($snacks[0]);

onMount(takeSessionSnack);
</script>

<CnSnackbar snack={current} onDismiss={dismissSnack} />
