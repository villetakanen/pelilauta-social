<script lang="ts">
import {
  REPLIES_COLLECTION,
  type Reply,
  ReplySchema,
} from 'src/schemas/ReplySchema';
import { THREADS_COLLECTION_NAME, type Thread } from 'src/schemas/ThreadSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { fixImageData } from 'src/utils/fixImageData';
import { t } from 'src/utils/i18n';
import { onMount } from 'svelte';
import { authUser, sessionState, uid } from '../../../stores/session';
import { hasSeen, setSeen, subscription } from '../../../stores/subscription';
import ReplyArticle from './ReplyArticle.svelte';
import ReplyDialog from './ReplyDialog.svelte';

interface Props {
  thread: Thread;
  discussion: Reply[];
}
const { discussion: initDiscussion, thread }: Props = $props();

let discussion = $state(initDiscussion);

const isLoading = $derived(
  $sessionState === 'loading' || ($sessionState === 'initial' && $uid !== ''),
);
const isAuthenticated = $derived($authUser && $sessionState === 'active');

onMount(async () => {
  const lastSeen = $subscription?.seenEntities?.[thread.key] || 0;

  if ($uid && !$hasSeen(thread.key, thread.flowTime)) {
    // We haven't seen this thread or it's latest comments yet, so we mark it as seen
    setSeen(thread.key);
  }

  // Scroll to unread logic
  const urlParams = new URLSearchParams(window.location.search);
  if ($uid && urlParams.get('jumpTo') === 'unread' && lastSeen > 0) {
    const firstUnread = discussion.find((r) => (r.flowTime || 0) > lastSeen);
    const targetReply = firstUnread || discussion[discussion.length - 1];
    if (targetReply) {
      setTimeout(() => {
        const element = document.getElementById(targetReply.key);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300); // Give it a moment to render
    }
  }

  const { getFirestore, query, collection, orderBy, onSnapshot } = await import(
    'firebase/firestore'
  );
  const db = getFirestore();

  const q = query(
    collection(db, THREADS_COLLECTION_NAME, thread.key, REPLIES_COLLECTION),
    orderBy('createdAt', 'asc'),
  );

  onSnapshot(q, (querySnapshot) => {
    const d = [...discussion];
    for (const change of querySnapshot.docChanges()) {
      const data = change.doc.data();
      if (change.type === 'removed') {
        const remove = d.findIndex((r) => r.key === change.doc.id);
        if (remove !== -1) {
          d.splice(remove, 1);
        }
      } else {
        const index = d.findIndex((r) => r.key === change.doc.id);
        const reply = ReplySchema.parse({
          ...toClientEntry(fixImageData(data)),
          key: change.doc.id,
          threadKey: thread.key,
        });
        if (index !== -1) {
          d[index] = reply;
        } else {
          d.push(reply);
        }
      }
    }
    discussion = d;
  });
});
</script>

<div class="content-columns">
  <section class="column-l">
    <div class="flex flex-col">
      {#each discussion as reply}
        <ReplyArticle {reply} />
      {/each}
    </div>

    {#if isLoading}
      <div class="toolbar items-center">
        <cn-loader small></cn-loader>
      </div>
    {:else if isAuthenticated}
      <ReplyDialog {thread} />
    {:else}
      <div class="toolbar items-center">
        <a href="/login" class="button">
          <cn-icon noun="send"></cn-icon>
          <span>{t("actions:login")}</span>
        </a>
      </div>
    {/if}
  </section>
</div>
