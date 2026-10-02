import { fetchDiscussion } from 'src/firebase/server/discussion/fetchDiscussion';
import { getPublicProfiles } from 'src/firebase/server/profiles';
import type { PublicProfile } from 'src/schemas/ProfileSchema';
import type { Reply } from 'src/schemas/ReplySchema';
import { markdownToHTML } from 'src/utils/marked';

/**
 * Represents a reply prepared for initial server rendering with pre-rendered
 * HTML and resolved public author attribution.
 */
export interface PreparedReply {
  reply: Reply;
  /**
   * Omitted when live subscriptions add replies after initial document
   * rendering. `ReplyArticle.svelte` renders markdown and resolves author
   * attribution on the client.
   */
  bodyHtml?: string;
  author?: PublicProfile;
}

/**
 * Contains prepared discussion replies and read status flags for server
 * rendering.
 *
 * `incomplete` is `true` when `fetchDiscussion` skipped malformed records.
 * `unavailable` is `true` when the collection read failed.
 */
export interface PreparedDiscussion {
  replies: PreparedReply[];
  incomplete: boolean;
  unavailable: boolean;
}

/**
 * Prepares thread replies for initial server rendering by fetching replies,
 * resolving author public profiles in a batched query, and rendering
 * markdown to HTML.
 *
 * @param threadKey Thread identifier.
 */
export async function prepareDiscussion(
  threadKey: string,
): Promise<PreparedDiscussion> {
  const { replies, incomplete, unavailable } = await fetchDiscussion(threadKey);

  const authorUids = replies.map((reply) => reply.owners[0]);
  const authors = await getPublicProfiles(authorUids);

  const prepared = await Promise.all(
    replies.map(async (reply) => ({
      reply,
      bodyHtml: await markdownToHTML(reply.markdownContent || ''),
      author: authors[reply.owners[0]],
    })),
  );

  return { replies: prepared, incomplete, unavailable };
}

/**
 * Returns the URL hash targeting the latest reply, or `#discussion` when the
 * thread carries no replies.
 */
export function latestReplyFragment(discussion: PreparedDiscussion): string {
  const lastReply = discussion.replies.at(-1);
  return lastReply ? `#${lastReply.reply.key}` : '#discussion';
}
