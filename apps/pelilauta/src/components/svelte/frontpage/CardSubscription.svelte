<script lang="ts">
import type { Thread } from 'src/schemas/ThreadSchema';
import { uid } from '../../../stores/session';
import { hasSeen } from '../../../stores/subscription';

interface Props {
  thread: Thread;
}
const { thread }: Props = $props();

/**
 * Unread signalling for a thread card. The card is rendered on the server and never
 * hydrated, so this island cannot give CnCard a new `notify` value; it toggles the
 * component's published `has-notify` state class on the card root instead.
 */
$effect(() => {
  const card = document
    .getElementById(`thread-card-${thread.key}`)
    ?.querySelector('.cn-card');
  if (!card) return;

  // Only an active session has read state to signal.
  const unread = !!$uid && !$hasSeen(thread.key, thread.flowTime);
  card.classList.toggle('has-notify', unread);
});
</script>
