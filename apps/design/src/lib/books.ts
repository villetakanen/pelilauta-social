import { getCollection } from 'astro:content';

/**
 * The design site's information architecture, derived from the content
 * collections rather than hand-kept. Site-owned on purpose: a getCollection()
 * call inside packages/design-system would make the package depend on this app's
 * collection config and on astro:content resolving from the package's tsconfig.
 */

/** Navigation groups in presentation order. A group id is the first URL segment. */
export const GROUPS = [
  { id: 'principles', label: 'Principles' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'components', label: 'Components' },
] as const;

export type GroupId = (typeof GROUPS)[number]['id'];

export interface BookLink {
  title: string;
  description: string;
  href: string;
  order: number;
}

export interface BookGroup {
  id: GroupId;
  label: string;
  books: BookLink[];
}

export const groupLabel = (id: string): string =>
  GROUPS.find((group) => group.id === id)?.label ?? id;

/**
 * Trailing slashes differ between `astro dev` (/tokens/color) and the built
 * static output (/tokens/color/), so active state must compare normalized paths
 * or it would silently stop matching in production.
 */
export const samePath = (a: string, b: string): boolean =>
  a.replace(/\/+$/, '') === b.replace(/\/+$/, '');

/** Every published book, grouped and sorted. Groups with no books are omitted. */
export async function getBookGroups(): Promise<BookGroup[]> {
  const groups = await Promise.all(
    GROUPS.map(async ({ id, label }) => {
      const entries = await getCollection(
        id,
        ({ data }) => data.status !== 'draft',
      );
      const books = entries
        .map((entry) => ({
          title: entry.data.title,
          description: entry.data.description,
          href: `/${id}/${entry.id}`,
          order: entry.data.order ?? 9999,
        }))
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
      return { id, label, books };
    }),
  );

  return groups.filter((group) => group.books.length > 0);
}
