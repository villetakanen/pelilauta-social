import { fetchDiscussion } from 'src/firebase/server/discussion/fetchDiscussion';
import { getPublicProfiles } from 'src/firebase/server/profiles';
import type { PublicProfile } from 'src/schemas/ProfileSchema';
import type { Reply } from 'src/schemas/ReplySchema';
import { markdownToHTML } from 'src/utils/marked';

/**
 * One reply, prepared for the initial document: its body already rendered
 * through `markdownToHTML` and its public attribution already resolved, so
 * `ReplyArticle.svelte` composes it without a browser profile request or a
 * client-side markdown pass.
 */
export interface PreparedReply {
  reply: Reply;
  /**
   * Optional because a reply the live subscription adds after the initial
   * render carries neither a rendered body nor resolved attribution;
   * `ReplyArticle.svelte` renders and resolves those itself in that case.
   */
  bodyHtml?: string;
  author?: PublicProfile;
}

/**
 * What the thread page's initial render needs from a thread's discussion.
 *
 * `incomplete` is `true` when `fetchDiscussion` skipped at least one
 * malformed record; the valid replies in `replies` render regardless.
 */
export interface PreparedDiscussion {
  replies: PreparedReply[];
  incomplete: boolean;
}

/**
 * Prepares a thread's discussion for the initial document: fetches the
 * replies, resolves every author's public attribution in one batched read,
 * and renders every body through `markdownToHTML` — the same renderer the
 * live path uses, so server and live rendering agree.
 *
 * @param threadKey the thread whose discussion to prepare
 */
export async function prepareDiscussion(
  threadKey: string,
): Promise<PreparedDiscussion> {
  const { replies, incomplete } = await fetchDiscussion(threadKey);

  const authorUids = replies.map((reply) => reply.owners[0]);
  const authors = await getPublicProfiles(authorUids);

  const prepared = await Promise.all(
    replies.map(async (reply) => ({
      reply,
      bodyHtml: await markdownToHTML(reply.markdownContent || ''),
      author: authors[reply.owners[0]],
    })),
  );

  return { replies: prepared, incomplete };
}
