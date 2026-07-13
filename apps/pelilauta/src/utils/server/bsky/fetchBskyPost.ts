import { logDebug, logError } from '@utils/logHelpers';

export interface BskyAuthor {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export interface BskyPostEmbed {
  type: 'image' | 'external' | 'record';
  images?: Array<{
    thumb: string;
    fullsize: string;
    alt?: string;
  }>;
  external?: {
    uri: string;
    title: string;
    description: string;
    thumb?: string;
  };
  record?: {
    uri: string;
    author: BskyAuthor;
    text: string;
  };
}

export interface BskyPost {
  uri: string;
  cid: string;
  author: BskyAuthor;
  text: string;
  createdAt: string;
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
  embed?: BskyPostEmbed;
}

/**
 * Fetches post data from Bluesky AT Protocol API
 * @param postUri - AT Protocol URI (e.g., at://did:plc:xxx/app.bsky.feed.post/yyy)
 * @returns Post data or null if fetch fails
 */
export async function fetchBskyPost(postUri: string): Promise<BskyPost | null> {
  try {
    logDebug('fetchBskyPost', 'Fetching post:', postUri);

    const apiUrl = `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(postUri)}&depth=0`;

    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      logError(
        'fetchBskyPost',
        `API request failed: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = await response.json();

    if (!data.thread?.post) {
      logError('fetchBskyPost', 'No post data in response');
      return null;
    }

    const post = data.thread.post;

    // Extract embed data if present
    let embed: BskyPostEmbed | undefined;
    if (post.embed) {
      if (post.embed.$type === 'app.bsky.embed.images#view') {
        embed = {
          type: 'image',
          images: post.embed.images.map(
            (img: { thumb: string; fullsize: string; alt?: string }) => ({
              thumb: img.thumb,
              fullsize: img.fullsize,
              alt: img.alt,
            }),
          ),
        };
      } else if (post.embed.$type === 'app.bsky.embed.external#view') {
        embed = {
          type: 'external',
          external: {
            uri: post.embed.external.uri,
            title: post.embed.external.title,
            description: post.embed.external.description,
            thumb: post.embed.external.thumb,
          },
        };
      } else if (post.embed.$type === 'app.bsky.embed.record#view') {
        const embeddedRecord = post.embed.record;
        embed = {
          type: 'record',
          record: {
            uri: embeddedRecord.uri,
            author: {
              did: embeddedRecord.author.did,
              handle: embeddedRecord.author.handle,
              displayName: embeddedRecord.author.displayName,
              avatar: embeddedRecord.author.avatar,
            },
            text: embeddedRecord.value?.text || '',
          },
        };
      }
    }

    const bskyPost: BskyPost = {
      uri: post.uri,
      cid: post.cid,
      author: {
        did: post.author.did,
        handle: post.author.handle,
        displayName: post.author.displayName,
        avatar: post.author.avatar,
      },
      text: post.record.text || '',
      createdAt: post.record.createdAt,
      likeCount: post.likeCount,
      repostCount: post.repostCount,
      replyCount: post.replyCount,
      embed,
    };

    logDebug('fetchBskyPost', 'Successfully fetched post:', bskyPost.uri);
    return bskyPost;
  } catch (error) {
    logError('fetchBskyPost', 'Exception fetching post:', error);
    return null;
  }
}
