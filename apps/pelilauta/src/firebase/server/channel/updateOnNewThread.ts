import {
  CHANNELS_META_REF,
  ChannelsSchema,
  EntryMetadataSchema,
} from 'src/schemas/ChannelSchema';
import type { Thread } from 'src/schemas/ThreadSchema';

/**
 * Handle channel metadata updates when a new thread is created.
 *
 * @param thread
 */
export async function updateOnNewThread(thread: Thread): Promise<void> {
  const { serverDB } = await import('..');
  const channelPath = CHANNELS_META_REF.split('/');

  const metadataRef = serverDB.collection(channelPath[0]).doc(channelPath[1]);
  const metadataDoc = await metadataRef.get();

  const channels = ChannelsSchema.parse(metadataDoc.data()?.topics || []);

  const entryMetadata = EntryMetadataSchema.parse({
    key: thread.key,
    createTime: thread.createdAt.getTime(),
    author: thread.owners[0] || '-',
  });

  const updatedChannels = channels.map((channel) => {
    if (channel.slug === thread.channel) {
      return {
        ...channel,
        threadCount: (channel.threadCount || 0) + 1,
        latestThread: entryMetadata,
        latestReply: entryMetadata, // Assuming the first post is the latest reply
      };
    }
    return channel;
  });

  serverDB
    .collection(channelPath[0])
    .doc(channelPath[1])
    .set({ topics: updatedChannels }, { merge: true });
}
