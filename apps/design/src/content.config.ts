import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { RUNTIME_IDS } from './lib/books';

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
  /**
   * Artwork for a CnPoster mounted behind this book. A poster is a page-level
   * singleton, so the only way a book can demonstrate one is to be one, and the
   * only way to declare it is here — the layout owns <body>, not the MDX.
   */
  poster: z.string().optional(),
});

/**
 * Only a component book states what an application must do to make the thing
 * work in the browser. Required, so the build fails on a book that omits it:
 * a template can be skipped, a schema cannot. Vocabulary: books/runtimes.json.
 */
const componentSchema = bookSchema.extend({
  runtime: z.enum(RUNTIME_IDS),
});

/*
 * Generic in the schema, and each group names its own: a widened parameter type
 * erases which schema a group uses, and `entry.data` degrades to `unknown`
 * wherever the collection is read.
 */
const book = <S extends z.ZodType>(group: string, schema: S) =>
  defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: `./src/content/${group}` }),
    schema,
  });

export const collections = {
  principles: book('principles', bookSchema),
  base: book('base', bookSchema),
  tokens: book('tokens', bookSchema),
  components: book('components', componentSchema),
  extensions: book('extensions', componentSchema),
};
