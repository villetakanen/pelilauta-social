import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Documentation books, one collection per navigation group. The collection id
 * is the first URL segment, so an entry `color` in `tokens` is served at
 * `/tokens/color` — see src/pages/[...slug].astro.
 *
 * A book is prose in MDX, importing a specimen component from
 * packages/design-system/books for anything read from source. Frontmatter is the
 * single source of the book's title, and the layout renders it as the page's only
 * <h1>, so a book states no h1 of its own.
 */
const bookSchema = z.object({
  title: z.string(),
  description: z.string(),
  /** Navigation sort key within the group; ties fall back to title order. */
  order: z.number().optional(),
});

const book = (group: string) =>
  defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: `./src/content/${group}` }),
    schema: bookSchema,
  });

export const collections = {
  principles: book('principles'),
  base: book('base'),
  tokens: book('tokens'),
  components: book('components'),
};
