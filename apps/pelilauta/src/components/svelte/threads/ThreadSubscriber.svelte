<script lang="ts">
import type { CnCard } from '@11thdeg/cyan-lit';
import type { Thread } from 'src/schemas/ThreadSchema';
import { uid } from '../../../stores/session';
import { hasSeen } from '../../../stores/subscription';

interface Props {
  thread: Thread;
}
const { thread }: Props = $props();

$effect(() => {
  const element = document.getElementById(`thread-${thread.key}`) as CnCard;
  if (!element) return;

  // This efffect should only run if we have an active user session
  if (!$uid) {
    element.classList.remove('notify');
    return;
  }

  // As we have an UID, we can check if the thread has been seen
  if ($hasSeen(thread.key, thread.flowTime)) {
    element.classList.remove('notify');
    return;
  }
  element.classList.add('notify');
});
</script>
