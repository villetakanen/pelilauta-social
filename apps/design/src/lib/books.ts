import { getCollection } from 'astro:content';
import taxonomy from '@design-system/books/groups.json';
import runtimeVocabulary from '@design-system/books/runtimes.json';

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

/**
 * What an application must do to make a component work in the browser. A tuple,
 * because the collection schema builds its enum from these ids — which keeps
 * runtimes.json the only place the vocabulary is written.
 */
export const RUNTIME_IDS = runtimeVocabulary.runtimes.map(
  (runtime) => runtime.id,
) as [string, ...string[]];

export type RuntimeId = (typeof RUNTIME_IDS)[number];

export const runtimeLabel = (id: string): string =>
  runtimeVocabulary.runtimes.find((runtime) => runtime.id === id)?.label ?? id;

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

/** Every book, grouped and sorted. Groups with no books are omitted. */
export async function getBookGroups(): Promise<BookGroup[]> {
  const groups = await Promise.all(
    GROUPS.map(async ({ id, label }) => {
      const entries = await getCollection(id);
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
