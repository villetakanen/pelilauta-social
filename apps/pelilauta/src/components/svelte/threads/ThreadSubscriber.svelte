<script lang="ts">
import type { Thread } from 'src/schemas/ThreadSchema';
import { uid } from '../../../stores/session';
import { hasSeen } from '../../../stores/subscription';

interface Props {
  thread: Thread;
}
const { thread }: Props = $props();

/**
 * Unread signalling for a thread row in a channel listing. The row is a Surface,
 * not a card, so it takes the design system's `has-notify` attention state — the
 * same signal the front page's CnCard shows, on the container this listing uses.
 */
$effect(() => {
  const row = document.getElementById(`thread-${thread.key}`);
  if (!row) return;

  // Only an active session has read state to signal.
  const unread = !!$uid && !$hasSeen(thread.key, thread.flowTime);
  row.classList.toggle('has-notify', unread);
});
</script>
