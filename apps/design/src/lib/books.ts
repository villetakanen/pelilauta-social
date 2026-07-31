import { getCollection } from 'astro:content';
import taxonomy from '@design-system/books/groups.json';

/**
 * The site reads the design system's own taxonomy and fills it from the content
 * collections. The taxonomy — which groups exist, their labels, their order — is
 * a package-level decision, because it states how the design system is
 * organised rather than how this site is built. Reading the collections stays
 * here: a getCollection() call inside packages/design-system would make the
 * package depend on this app's collection config and on astro:content resolving
 * from the package's tsconfig.
 */

/** Collection names, which are also the URL groups. Must match groups.json. */
export type GroupId = 'principles' | 'base' | 'tokens' | 'components';

export const GROUPS: readonly { id: GroupId; label: string }[] =
  taxonomy.groups as { id: GroupId; label: string }[];

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
