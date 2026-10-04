<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import {
  REPLIES_COLLECTION,
  type Reply,
  ReplySchema,
} from 'src/schemas/ReplySchema';
import { THREADS_COLLECTION_NAME, type Thread } from 'src/schemas/ThreadSchema';
import type { PublicProfile } from 'src/stores/profiles';
import { uid } from 'src/stores/session';
import { isActive, isRehydrating } from 'src/stores/session/computed';
import { hasSeen, setSeen, subscription } from 'src/stores/subscription';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { fixImageData } from 'src/utils/fixImageData';
import { t } from 'src/utils/i18n';
import { onMount } from 'svelte';
import ReplyArticle from './ReplyArticle.svelte';

interface Props {
  thread: Thread;
  discussion: Reply[];
  /** The server's answer for each author, by uid; kept apart from the replies a live snapshot replaces. */
  authors: Record<string, PublicProfile>;
}
const { discussion: initDiscussion, thread, authors }: Props = $props();

let discussion = $state(initDiscussion);

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
});

let liveFailed = $state(false);

$effect(() => {
  // An account change re-runs the effect, so the uid is read here.
  const active = $isActive;
  void $uid;
  if (!active) return;

  let cancelled = false;
  let unsubscribe: (() => void) | undefined;
  liveFailed = false;

  (async () => {
    const { getFirestore, query, collection, orderBy, onSnapshot } =
      await import('firebase/firestore');
    if (cancelled) return;
    const db = getFirestore();

    const q = query(
      collection(db, THREADS_COLLECTION_NAME, thread.key, REPLIES_COLLECTION),
      orderBy('createdAt', 'asc'),
    );

    unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (cancelled) return;
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
      },
      () => {
        if (!cancelled) liveFailed = true;
      },
    );
  })();

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
});
</script>

<section class="content-prose" aria-labelledby="discussion-title">
  <h2 id="discussion-title">{t("threads:discussion.title")}</h2>

  {#if discussion.length === 0}
    <p>{t("threads:discussion.empty")}</p>
  {:else}
    <div class="replies">
      {#each discussion as reply}
        <ReplyArticle {reply} author={authors[reply.owners[0]]} />
      {/each}
    </div>
  {/if}

  {#if liveFailed}
    <p role="status">{t("threads:discussion.liveFailed")}</p>
  {/if}

  <!--
    A signed-in reader writes in the chat bar the thread page mounts in chrome,
    so nothing stands here for them. A reader who is not signed in is invited
    to the discussion instead, at the end of the replies, in the document.
  -->
  {#if $isRehydrating}
    <div class="text-center">
      <CnLoader inline />
    </div>
  {:else if !$isActive}
    <div class="text-center">
      <a href="/login" class="button">
        <CnIcon noun="discussion" />
        <span>{t("threads:discussion.join")}</span>
      </a>
    </div>
  {/if}
</section>

<style>
  /*
   * The Golden container places this section and reaches no deeper, so the
   * interval between one reply and the next is stated here.
   */
  .replies {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>
