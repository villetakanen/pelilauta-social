<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import { REPLIES_COLLECTION, type Reply } from 'src/schemas/ReplySchema';
import { THREADS_COLLECTION_NAME, type Thread } from 'src/schemas/ThreadSchema';
import type { PublicProfile } from 'src/stores/profiles';
import { uid } from 'src/stores/session';
import {
  isActive,
  isRehydrating,
  isResolvedActive,
} from 'src/stores/session/computed';
import { hasSeen, setSeen } from 'src/stores/subscription';
import { t } from 'src/utils/i18n';
import { onMount } from 'svelte';
import { parseSnapshotReplies } from './parseSnapshotReplies';
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
  if ($uid && !$hasSeen(thread.key, thread.flowTime)) {
    // We haven't seen this thread or it's latest comments yet, so we mark it as seen
    setSeen(thread.key);
  }

  // The page takes the jump target from the timestamp in the URL alone; the
  // producer of the link decides what that timestamp means.
  const jumpTo = Number(
    new URLSearchParams(window.location.search).get('jumpTo'),
  );
  const fragment = decodeURIComponent(window.location.hash.slice(1));
  const namesReply = discussion.some((r) => r.key === fragment);
  if ($uid && Number.isFinite(jumpTo) && jumpTo > 0 && !namesReply) {
    const atOrBefore = discussion.filter(
      (r) => r.createdAt && r.createdAt.getTime() <= jumpTo,
    );
    const targetId =
      atOrBefore.length > 0
        ? atOrBefore[atOrBefore.length - 1].key
        : 'discussion-title';
    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
    });
  }
});

let liveFailed = $state(false);

$effect(() => {
  // An account change re-runs the effect, so the uid is read here.
  const active = $isResolvedActive;
  void $uid;
  liveFailed = false;
  if (!active) return;

  let cancelled = false;
  let unsubscribe: (() => void) | undefined;

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
        discussion = parseSnapshotReplies(querySnapshot.docs, thread.key);
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

<section
  id="discussion"
  class="content-prose"
  aria-labelledby="discussion-title"
>
  <h2 id="discussion-title">{t("threads:discussion.title")}</h2>

  {#if discussion.length > 0}
    <p>
      <a href={`#${discussion[discussion.length - 1].key}`}>
        {t("threads:discussion.latest")}
      </a>
    </p>
  {/if}

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
