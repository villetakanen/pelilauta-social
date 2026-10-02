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
import type { PreparedReply } from 'src/threads/server/prepareDiscussion';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { fixImageData } from 'src/utils/fixImageData';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import { onMount, tick } from 'svelte';
import ReplyArticle from './ReplyArticle.svelte';

interface Props {
  thread: Thread;
  discussion: PreparedReply[];
  incomplete?: boolean;
  /** The server read of replies failed. */
  unavailable?: boolean;
}
const {
  discussion: initDiscussion,
  thread,
  incomplete: initIncomplete,
  unavailable: initUnavailable,
}: Props = $props();

let discussion = $state(initDiscussion);
/*
 * The server read reports records that failed parsing. Because a live snapshot
 * can also deliver a malformed record, the component stores this notice in
 * state.
 */
let incomplete = $state(initIncomplete === true);
/*
 * A live snapshot clears `unavailable` when replies arrive after an initial
 * server read failure.
 */
let unavailable = $state(initUnavailable === true);
/** The live subscription failed. Rendered replies remain visible. */
let updatesUnavailable = $state(false);

let headingElement: HTMLHeadingElement;

/**
 * Anonymous visitors and unresolved sessions open no Firestore subscription.
 * Only an active signed-in session subscribes. Because `$isActive` can become
 * true after mounting, this effect manages the subscription lifecycle.
 * Changing accounts or signing out terminates the previous listener before a
 * new listener starts.
 */
let subscribedUid: string | null = null;
let unsubscribe: (() => void) | null = null;
/*
 * Because `subscribeToReplies` awaits a dynamic import, teardown can occur
 * while the import is in flight. Each subscription records its generation.
 * The callback discards results from older generations.
 */
let generation = 0;

function terminateSubscription() {
  generation += 1;
  subscribedUid = null;
  unsubscribe?.();
  unsubscribe = null;
}

$effect(() => {
  const account = $isActive ? $uid : '';

  if (!account) {
    terminateSubscription();
    return;
  }
  if (account === subscribedUid) return;

  terminateSubscription();
  subscribedUid = account;
  subscribeToReplies(account);
});

$effect(() => terminateSubscription);

async function subscribeToReplies(account: string) {
  const attempt = generation;
  const { getFirestore, query, collection, onSnapshot, orderBy } = await import(
    'firebase/firestore'
  );
  if (attempt !== generation) return;

  const db = getFirestore();

  /*
   * Firestore excludes documents lacking the sort field, omitting replies
   * stored without a creation timestamp.
   */
  const q = query(
    collection(db, THREADS_COLLECTION_NAME, thread.key, REPLIES_COLLECTION),
    orderBy('createdAt', 'asc'),
  );

  const stop = onSnapshot(
    q,
    (querySnapshot) => {
      if (attempt !== generation) return;
      const d: PreparedReply[] = [];
      for (const doc of querySnapshot.docs) {
        /*
         * Each record parses in isolation. A malformed document marks the
         * discussion incomplete without discarding valid replies.
         */
        let reply: Reply;
        try {
          reply = ReplySchema.parse({
            ...toClientEntry(fixImageData(doc.data())),
            key: doc.id,
            threadKey: thread.key,
          });
        } catch (error) {
          logError(
            'DiscussionSection',
            'Skipping malformed reply',
            doc.id,
            error,
          );
          incomplete = true;
          continue;
        }
        // `ReplyArticle.svelte` resolves author attribution from the profile
        // store and renders markdown to HTML when props omit them.
        d.push({ reply });
      }
      unavailable = false;
      updatesUnavailable = false;
      applyDiscussion(d);
    },
    (error) => {
      if (attempt !== generation) return;
      logError('DiscussionSection', 'Reply subscription failed', error);
      updatesUnavailable = true;
    },
  );

  // The callback stops the listener when the subscription terminates before registration completes.
  if (attempt !== generation) {
    stop();
    return;
  }
  unsubscribe = stop;
}

/**
 * `enclosingReplyKey` returns the reply key containing the node, or `null`
 * when the node sits outside all replies. `ReplyArticle.svelte` sets each
 * element ID to its reply key.
 */
function enclosingReplyKey(node: Element | null): string | null {
  const keys = new Set(discussion.map((item) => item.reply.key));
  let current = node;
  while (current) {
    if (current.id && keys.has(current.id)) return current.id;
    current = current.parentElement;
  }
  return null;
}

/**
 * Updates the rendered discussion. Browser scroll anchoring preserves the
 * visible passage and clamps at document boundaries, so the function does not
 * adjust the viewport.
 */
function applyDiscussion(next: PreparedReply[]) {
  const nextKeys = next.map((item) => item.reply.key);
  const focusedKey = enclosingReplyKey(document.activeElement);
  const focusLost = focusedKey !== null && !nextKeys.includes(focusedKey);

  discussion = next;

  if (!focusLost) return;

  tick().then(() => {
    // Focus moves to the heading when an update removes the focused reply.
    // `preventScroll` leaves the scroll position to the browser.
    headingElement?.focus({ preventScroll: true });
  });
}

onMount(() => {
  const lastSeen = $subscription?.seenEntities?.[thread.key] || 0;

  if ($uid && !$hasSeen(thread.key, thread.flowTime)) {
    setSeen(thread.key);
  }

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
      }, 300);
    }
  }
});
</script>

<section id="discussion" class="content-prose" aria-labelledby="discussion-title">
  <!-- `tabindex="-1"` allows programmatic focus when an update removes the active reply. -->
  <h2 id="discussion-title" tabindex="-1" bind:this={headingElement}>{t("threads:discussion.title")}</h2>

  {#if unavailable}
    <p class="surface error" role="status" data-testid="discussion-unavailable">
      {t("threads:discussion.unavailable")}
    </p>
  {/if}

  {#if updatesUnavailable}
    <p class="surface text-small" role="status" data-testid="discussion-updates-unavailable">
      {t("threads:discussion.updatesUnavailable")}
    </p>
  {/if}

  {#if incomplete}
    <p class="text-small text-low">{t("threads:discussion.incomplete")}</p>
  {/if}

  {#if discussion.length === 0}
    {#if !unavailable}
      <p>{t("threads:discussion.empty")}</p>
    {/if}
  {:else}
    <div class="replies">
      {#each discussion as item (item.reply.key)}
        <ReplyArticle reply={item.reply} author={item.author} bodyHtml={item.bodyHtml} />
      {/each}
    </div>
  {/if}

  <!--
    The chat bar in the page frame serves signed-in members. Visitors see
    the sign-in prompt below the discussion.
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
  .replies {
    display: grid;
    row-gap: var(--cn-line);
  }

  /*
   * The rule suppresses focus rings during programmatic focus transfers.
   */
  h2:focus:not(:focus-visible) {
    outline: none;
  }
</style>
