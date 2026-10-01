import type { PublicProfile } from 'src/schemas/ProfileSchema';
import type { Thread } from 'src/schemas/ThreadSchema';
import { toDate } from 'src/utils/schemaHelpers';
import type { PreparedDiscussion } from './prepareDiscussion';

/**
 * The structured-data description of a thread, as the initial document
 * carries it: one `DiscussionForumPosting` for the opening post and one
 * `Comment` for each reply the document renders.
 *
 * Every property is derived from the same prepared content the document
 * renders, so the graph never states a fact the page does not.
 */
export interface DiscussionGraph {
  '@context': 'https://schema.org';
  '@type': 'DiscussionForumPosting';
  '@id': string;
  url: string;
  headline: string;
  text: string;
  datePublished: string;
  dateModified?: string;
  author: PersonMetadata;
  interactionStatistic?: {
    '@type': 'InteractionCounter';
    interactionType: 'https://schema.org/CommentAction';
    userInteractionCount: number;
  };
  comment?: CommentMetadata[];
}

interface PersonMetadata {
  '@type': 'Person';
  name: string;
  url: string;
}

interface CommentMetadata {
  '@type': 'Comment';
  '@id': string;
  url: string;
  text: string;
  datePublished: string;
  dateModified?: string;
  author: PersonMetadata;
}

export interface DiscussionGraphSource {
  thread: Thread;
  /** Public attribution for the opening post, or `null` when it does not resolve. */
  authorAttribution: PublicProfile | null;
  discussion: PreparedDiscussion;
  /** The deployment's origin, which turns every key into an absolute URL. */
  origin: string;
}

function person(profile: PublicProfile, origin: string): PersonMetadata {
  return {
    '@type': 'Person',
    name: profile.nick,
    url: `${origin}/profiles/${profile.key}`,
  };
}

/**
 * A later edit, as a date, or `undefined` when the record carries no edit
 * later than its creation.
 */
function editedAt(createdAt: Date, stored: unknown): string | undefined {
  if (!stored) return undefined;
  const updated = toDate(stored);
  return updated.getTime() > createdAt.getTime()
    ? updated.toISOString()
    : undefined;
}

/**
 * Builds the discussion graph for a thread's initial document.
 *
 * A contribution qualifies only when it carries every property the graph
 * states about it: a resolvable public author, body text, and a creation
 * date. A reply short of that is left out of `comment` while still rendering;
 * an opening post short of that returns `null`, because a forum posting is
 * the graph's root and nothing stands without it.
 *
 * @returns the graph, or `null` when the opening post does not qualify
 */
export function buildDiscussionGraph({
  thread,
  authorAttribution,
  discussion,
  origin,
}: DiscussionGraphSource): DiscussionGraph | null {
  const threadUrl = `${origin}/threads/${thread.key}`;
  const text = thread.markdownContent || thread.content || '';

  if (!authorAttribution || !thread.title || !text || !thread.createdAt) {
    return null;
  }

  const publishedAt = toDate(thread.createdAt);

  const comments: CommentMetadata[] = [];
  for (const { reply, author } of discussion.replies) {
    const replyText = reply.markdownContent || '';
    if (!author || !replyText || !reply.createdAt) continue;

    const replyPublishedAt = toDate(reply.createdAt);
    const replyUrl = `${threadUrl}#${reply.key}`;
    const modified = editedAt(replyPublishedAt, reply.updatedAt);

    comments.push({
      '@type': 'Comment',
      '@id': replyUrl,
      url: replyUrl,
      text: replyText,
      datePublished: replyPublishedAt.toISOString(),
      ...(modified ? { dateModified: modified } : {}),
      author: person(author, origin),
    });
  }

  const modified = editedAt(publishedAt, thread.updatedAt);

  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    '@id': threadUrl,
    url: threadUrl,
    headline: thread.title,
    text,
    datePublished: publishedAt.toISOString(),
    ...(modified ? { dateModified: modified } : {}),
    author: person(authorAttribution, origin),
    ...(comments.length > 0
      ? {
          interactionStatistic: {
            '@type': 'InteractionCounter' as const,
            interactionType: 'https://schema.org/CommentAction' as const,
            userInteractionCount: comments.length,
          },
          comment: comments,
        }
      : {}),
  };
}

/**
 * Serializes a graph for a `<script type="application/ld+json">` block.
 *
 * The block is character data, so a title or a body containing `<`, `>` or
 * `&` would otherwise end the element or introduce markup: a reply whose text
 * contains `</script>` would close the block and leave the rest of the reply
 * standing in the document as markup. Escaping those three characters as JSON
 * `\u` sequences keeps every one of them inside the string, and a JSON parser
 * reads the original text back unchanged.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}
