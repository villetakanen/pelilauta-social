<script lang="ts">
import { persistentAtom } from '@nanostores/persistent';
import { toggleReaction } from 'src/firebase/client/reactions';
import {
  REACTIONS_COLLECTION_NAME,
  type Reactions,
  reactionsSchema,
} from 'src/schemas/ReactionsSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logDebug, logWarn } from 'src/utils/logHelpers';
import { onMount } from 'svelte';
import { uid } from '../../../stores/session';

/**
 * An universal "love" button for Pelilauta 16+. The functionality here might break 16 and lesser
 * versions of the pelilauta social functionality.
 *
 * We'll introduce the button in a non breaking way, but might need to up the MAJOR version
 * if a breaking change is needed.
 *
 * Core concepts:
 * - Each *Entry* has a *Reactions* object in the DB that contains the reactions to that entry.
 * - Each *Reaction* has a *type*, *count* and *users* array. The Count is not stored in the DB, but calculated on the fly.
 * - The *users* array contains the pseudoanonymous user ids of the users that have reacted with the reaction.
 * - subscriptions are used to keep track of the users interested in the entry. F.ex. the owner(s) of the entry.
 *
 * F.ex. a *love* reaction by "user3" to an entry might look like this in the DB:
 * ENTRY_KEY:
 * - subscribers: ['user1', 'user4]
 * - type: 'love'
 * -- users: ['user1', 'user2', 'user3']
 * - type: 'bookmark'
 * -- users: ['user1', 'user2']
 *
 * DB key of the reactions entry is same as the entry key.
 *
 * To query, if a user has reacted with a reaction, you can check if the user id is in the *users* array.
 *
 * To query all users reactions, simply query the *Reactions* object of the entry with "array-contains" "user id".
 */
interface Props {
  title?: string;
  type?: 'love';
  small?: boolean;
  key: string;
  target: 'thread' | 'site' | 'reply';
}
const { type = 'love', small = false, key, target, title }: Props = $props();

const reactions = persistentAtom<Reactions>(
  `reactions/${key}`,
  { subscribers: [] },
  {
    encode: JSON.stringify,
    decode: (data) => {
      const object = JSON.parse(data);
      return reactionsSchema.parse(object);
    },
  },
);

const count = $derived.by(() => {
  return $reactions[type]?.length || 0;
});

const checked = $derived.by(() => {
  return $reactions[type]?.includes($uid) || undefined;
});

const inactive = $derived.by(() => {
  if ($reactions.subscribers.includes($uid)) return true;
  return undefined;
});

onMount(async () => {
  try {
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
    const reactionsDoc = await getDoc(
      doc(getFirestore(), `${REACTIONS_COLLECTION_NAME}/${key}`),
    );
    if (reactionsDoc.exists()) {
      reactions.set(reactionsSchema.parse(reactionsDoc.data()));
    }
  } catch (error) {
    logWarn('ReactionButton', 'Failed to fetch reactions:', error);
  }
});

async function onclick(e: Event) {
  e.preventDefault();
  logDebug('ReactionButton', `Reaction ${type} clicked for ${key}`);
  if (!$uid) return;

  const currentReactions = reactions.get();

  // Optimistic update - calculate what the new state should be
  const reaction = [...(currentReactions[type] || [])];
  const index = reaction.indexOf($uid);
  const wasAdded = index === -1;

  if (wasAdded) {
    reaction.push($uid);
  } else {
    reaction.splice(index, 1);
  }

  const optimisticReactions = {
    ...currentReactions,
    [type]: reaction,
  };

  // Apply optimistic update
  reactions.set(optimisticReactions);

  try {
    // Call the server API
    const result = await toggleReaction({
      key,
      type,
      target,
      title,
    });

    if (result.success && result.reactions) {
      // Update with the actual server response
      reactions.set(result.reactions);
    } else {
      // Rollback on API error
      reactions.set(currentReactions);
      logWarn('ReactionButton', 'API error:', result.error);
      pushSnack(t('app:errors.internal'));
    }
  } catch (error) {
    // Rollback on network error
    reactions.set(currentReactions);
    logWarn('ReactionButton', 'Failed to update reaction, rolled back:', error);
    pushSnack(t('app:errors.internal'));
  }
}
</script>

{#if $uid }
  <cn-reaction-button
    {onclick}
    role="button"
    tabindex="0"
    onkeydown={(e: Event) => {if ((e as KeyboardEvent).key === 'Enter') onclick(e);}}
    {count}
    {checked}
    {inactive}
    aria-pressed={checked}
    noun={type}
    small={small || undefined}
  ></cn-reaction-button>  
{/if}


