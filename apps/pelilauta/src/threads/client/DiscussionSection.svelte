<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import {
  REPLIES_COLLECTION,
  type Reply,
  ReplySchema,
} from 'src/schemas/ReplySchema';
import { THREADS_COLLECTION_NAME, type Thread } from 'src/schemas/ThreadSchema';
import { uid } from 'src/stores/session';
import { isActive, isRehydrating } from 'src/stores/session/computed';
import { hasSeen, setSeen, subscription } from 'src/stores/subscription';
import { compareReplies } from 'src/threads/replyOrder';
import type { PreparedReply } from 'src/threads/server/prepareDiscussion';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { fixImageData } from 'src/utils/fixImageData';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import { onMount } from 'svelte';
import ReplyArticle from './ReplyArticle.svelte';

interface Props {
  thread: Thread;
  discussion: PreparedReply[];
  incomplete?: boolean;
}
const {
  discussion: initDiscussion,
  thread,
  incomplete: initIncomplete,
}: Props = $props();

let discussion = $state(initDiscussion);
/*
 * The server read reports the records it could not parse; a live snapshot can
 * carry one too, so the notice is state here, never only a prop.
 */
let incomplete = $state(initIncomplete === true);

/**
 * Anonymous reading, and an unresolved session, open no Firebase
 * subscription. Only an active signed-in session subscribes, and only once:
 * `$isActive` can turn true after this component mounted (session
 * resolution completing after the initial render), so this effect — not
 * `onMount` — is what starts it.
 */
let subscribed = false;
$effect(() => {
  if ($isActive && !subscribed) {
    subscribed = true;
    subscribeToReplies();
  }
});

async function subscribeToReplies() {
  const { getFirestore, query, collection, onSnapshot } = await import(
    'firebase/firestore'
  );
  const db = getFirestore();

  /*
   * The query states no order: `src/threads/replyOrder.ts` is the one
   * ordering both reads apply, and an `orderBy('createdAt')` would also drop
   * every reply stored without a creation time from the result.
   */
  const q = query(
    collection(db, THREADS_COLLECTION_NAME, thread.key, REPLIES_COLLECTION),
  );

  onSnapshot(q, (querySnapshot) => {
    const d = [...discussion];
    for (const change of querySnapshot.docChanges()) {
      const data = change.doc.data();
      if (change.type === 'removed') {
        const remove = d.findIndex((item) => item.reply.key === change.doc.id);
        if (remove !== -1) {
          d.splice(remove, 1);
        }
      } else {
        const index = d.findIndex((item) => item.reply.key === change.doc.id);
        /*
         * Each record parses in isolation, the same as the server read: a
         * malformed one — a reply stored without a creation time among them —
         * leaves every valid reply standing and reports incomplete content.
         */
        let reply: Reply;
        try {
          reply = ReplySchema.parse({
            ...toClientEntry(fixImageData(data)),
            key: change.doc.id,
            threadKey: thread.key,
          });
        } catch (error) {
          logError(
            'DiscussionSection',
            'Skipping malformed reply',
            change.doc.id,
            error,
          );
          incomplete = true;
          continue;
        }
        // Attribution and body render client-side, the same as any other
        // reply this component did not receive prepared: ReplyArticle
        // resolves author from the profile store and renders the body
        // through markdownToHTML when neither prop is given.
        const item: PreparedReply = { reply };
        if (index !== -1) {
          d[index] = item;
        } else {
          d.push(item);
        }
      }
    }
    // Reconciliation places nothing: the one comparator orders the whole
    // array once every change in this snapshot is applied.
    d.sort((first, second) => compareReplies(first.reply, second.reply));
    discussion = d;
  });
}

onMount(() => {
  const lastSeen = $subscription?.seenEntities?.[thread.key] || 0;

  if ($uid && !$hasSeen(thread.key, thread.flowTime)) {
    // We haven't seen this thread or it's latest comments yet, so we mark it as seen
    setSeen(thread.key);
  }

  // Scroll to unread logic
  const urlParams = new URLSearchParams(window.location.search);
  if ($uid && urlParams.get('jumpTo') === 'unread' && lastSeen > 0) {
    const firstUnread = discussion.find(
      (item) => (item.reply.flowTime || 0) > lastSeen,
    );
    const targetReply = firstUnread || discussion[discussion.length - 1];
    if (targetReply) {
      setTimeout(() => {
        const element = document.getElementById(targetReply.reply.key);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300); // Give it a moment to render
    }
  }
});
</script>

<section id="discussion" class="content-prose" aria-labelledby="discussion-title">
  <h2 id="discussion-title">{t("threads:discussion.title")}</h2>

  {#if incomplete}
    <p class="text-small text-low">{t("threads:discussion.incomplete")}</p>
  {/if}

  {#if discussion.length === 0}
    <p>{t("threads:discussion.empty")}</p>
  {:else}
    <div class="replies">
      {#each discussion as item (item.reply.key)}
        <ReplyArticle reply={item.reply} author={item.author} bodyHtml={item.bodyHtml} />
      {/each}
    </div>
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
