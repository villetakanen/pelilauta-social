import { authedPost } from 'src/firebase/client/apiClient';
import { type Channel, ChannelSchema } from 'src/schemas/ChannelSchema';
import { PROFILES_COLLECTION_NAME } from 'src/schemas/ProfileSchema';
import type { Thread } from 'src/schemas/ThreadSchema';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';

async function getProfile(uid: string) {
  const { db } = await import('../../../firebase/client');
  const { getDoc, doc } = await import('firebase/firestore');
  const { normalizeProfileData } = await import('../../../stores/profiles');

  try {
    const publicProfileDoc = await getDoc(
      doc(db, PROFILES_COLLECTION_NAME, uid),
    );
    if (publicProfileDoc.exists()) {
      const profileData = publicProfileDoc.data();
      if (profileData) {
        return normalizeProfileData(profileData, uid);
      }
    }
  } catch (error) {
    logError('submitThreadUpdate', 'getProfile', uid, error);
  }
  return {
    key: uid,
    nick: 'Anonymous',
    username: 'Anonymous',
    avatarUrl: '',
    bio: '',
    frozen: false,
  };
}

export async function syndicateToBsky(
  thread: Thread,
  uid: string,
): Promise<{ success: boolean; blueskyPostUrl?: string; error?: string }> {
  const profile = await getProfile(uid);

  // Fetch channels from the server
  const channelsResponse = await fetch(
    `${window.location.origin}/api/meta/channels.json`,
  );
  const channelsData = await channelsResponse.json();
  const channels = channelsData.map((channel: Partial<Channel>) =>
    ChannelSchema.parse(channel),
  );
  const channelTitle =
    channels.find((channel: Channel) => channel.slug === thread.channel)
      ?.name || thread.channel;

  if (!thread.markdownContent) {
    return { success: false, error: 'No content to syndicate' };
  }

  const text = `${profile?.nick || 'Pelilauta'} loi uuden ketjun aiheessa: ${channelTitle}\n\n #roolipelit #pelilauta #roolipelsky`;
  const linkUrl = `https://pelilauta.social/threads/${thread.key}`;
  const linkTitle = thread.title;
  const linkDescription = `${thread.markdownContent.substring(0, 220)}...`;

  try {
    // Post to Bluesky and capture the response
    const httpResponse = await authedPost(
      `${window.location.origin}/api/bsky/skeet`,
      {
        text,
        linkUrl,
        linkTitle,
        linkDescription,
      },
    );

    const response = await httpResponse.json();

    if (!response.success || !response.blueskyUri) {
      logError('syndicateToBsky', 'Failed to post to Bluesky:', response.error);
      return { success: false, error: response.error || 'Unknown error' };
    }

    // Convert AT Protocol URI to web URL
    const { atUriToWebUrl } = await import('src/utils/bskyHelpers');
    const blueskyPostUrl = atUriToWebUrl(
      response.blueskyUri,
      profile?.username || 'pelilauta.social',
    );

    if (!blueskyPostUrl) {
      logError('syndicateToBsky', 'Failed to convert Bluesky URI to URL');
      return { success: false, error: 'Failed to generate post URL' };
    }

    // Save Bluesky data to Firestore
    const { db } = await import('../../../firebase/client');
    const { doc, updateDoc } = await import('firebase/firestore');
    const { THREADS_COLLECTION_NAME } = await import(
      'src/schemas/ThreadSchema'
    );

    await updateDoc(doc(db, THREADS_COLLECTION_NAME, thread.key), {
      blueskyPostUrl,
      blueskyPostUri: response.blueskyUri,
      blueskyPostCreatedAt: new Date(),
    });

    return { success: true, blueskyPostUrl };
  } catch (error) {
    logError('syndicateToBsky', 'Exception during Bluesky syndication:', error);
    return { success: false, error: 'Network or server error' };
  }
}

export async function submitThreadUpdate(
  data: Partial<Thread>,
  files?: File[],
) {
  const { createThreadApi } = await import(
    '../../../firebase/client/threads/createThreadApi.ts'
  );
  const { updateThreadApi } = await import(
    '../../../firebase/client/threads/updateThreadApi.ts'
  );

  if (!data.title || !data.markdownContent || !data.channel || !data.owners) {
    throw new Error('Missing minimum required fields');
  }

  // Handle thread updates (e.g., editing a thread)
  if (data.key) {
    // Use the new API endpoint for thread updates
    await updateThreadApi(data);
    return data.key;
  }

  // Create new thread using the API
  const threadKey = await createThreadApi(data, files || []);

  // Create a thread object for syndication (with the new key)
  const postedThread: Thread = {
    ...data,
    key: threadKey,
  } as Thread;

  // Syndicate to Bluesky and handle the result
  const syndicationResult = await syndicateToBsky(postedThread, data.owners[0]);

  if (!syndicationResult.success) {
    // Don't fail the entire operation, just log the error
    logWarn(
      'submitThreadUpdate',
      'Bluesky syndication failed:',
      syndicationResult.error,
    );
    // TODO: Show user notification that syndication failed
  } else {
    logDebug(
      'submitThreadUpdate',
      'Bluesky syndication succeeded:',
      syndicationResult.blueskyPostUrl,
    );
    // TODO: Show user notification with link to Bluesky post
  }

  return threadKey;
}
