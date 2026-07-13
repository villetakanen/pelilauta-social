import { ChannelsSchema } from '@schemas/ChannelSchema';
import { TOPICS_META_REF, TopicsSchema } from '@schemas/TopicSchema';
import { logDebug, logError, logWarn } from '@utils/logHelpers';
import { atom, computed, onMount } from 'nanostores';
import { z } from 'zod';

export const addTopicFormOpen = atom(false);
export const meta = atom<ForumsMeta | null>(null);
export const metaLoading = atom(true);

// Renamed for clarity - this is forums metadata, not just threads
const forumsMetaSchema = z.object({
  topicsArray: TopicsSchema.default([]),
  topics: ChannelsSchema.default([]), // To avoid db migrations, we use the old key for channels array
});
export type ForumsMeta = z.infer<typeof forumsMetaSchema>;

export const forumTopics = computed(meta, ($meta) => {
  return $meta?.topicsArray ?? [];
});

onMount(meta, () => {
  logDebug('ChannelsAdminStore', 'Meta store mounted');
  subscribeToMeta();

  // Cleanup subscription when store is no longer used
  return () => {
    if (unsubscribe) {
      logDebug('ChannelsAdminStore', 'Cleaning up subscription');
      unsubscribe();
    }
  };
});

let unsubscribe: (() => void) | null = null;

async function subscribeToMeta() {
  // Clean up existing subscription
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  try {
    metaLoading.set(true);
    const { db } = await import('@firebase/client');
    const { doc, onSnapshot } = await import('firebase/firestore');

    const metaDocRef = doc(db, TOPICS_META_REF);

    unsubscribe = onSnapshot(
      metaDocRef,
      (docSnap) => {
        metaLoading.set(false);

        if (docSnap.exists()) {
          logDebug('ChannelsAdminStore', 'Received meta document update');
          const data = docSnap.data() as Record<string, unknown>;
          const metaData = forumsMetaSchema.parse(data);

          if (metaData) {
            meta.set(metaData);
          } else {
            logError(
              'ChannelsAdminStore',
              'Failed to migrate meta data:',
              data,
            );
            meta.set(null);
          }
        } else {
          logWarn('ChannelsAdminStore', 'Meta document does not exist');
          meta.set(null);
        }
      },
      (error) => {
        metaLoading.set(false);
        logError('ChannelsAdminStore', 'Error in meta subscription:', error);
        meta.set(null);

        // Retry subscription after delay
        setTimeout(() => {
          logDebug('ChannelsAdminStore', 'Retrying meta subscription...');
          subscribeToMeta();
        }, 5000);
      },
    );
  } catch (error) {
    metaLoading.set(false);
    logError(
      'ChannelsAdminStore',
      'Failed to set up meta subscription:',
      error,
    );
    meta.set(null);
  }
}
