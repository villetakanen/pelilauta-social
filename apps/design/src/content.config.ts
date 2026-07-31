import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Documentation books, one collection per navigation group. The collection id
 * is the first URL segment, so an entry `color` in `tokens` is served at
 * `/tokens/color` — see src/pages/[...slug].astro.
 *
 * A book's MDX body is a thin shell that renders one package-owned Astro
 * component from packages/design-system/books. Frontmatter is the single source
 * of the book's title: the shell passes it into the component, which renders it
 * as the page's only <h1>.
 */
const bookSchema = z.object({
  title: z.string(),
  description: z.string(),
  /** Navigation sort key within the group; ties fall back to title order. */
  order: z.number().optional(),
  /**
   * A prose book: the shell renders its h1 and groups the body. The legacy
   * `books/*.astro` books lay out their own sections and render their own h1,
   * which is why the default is false.
   */
  prose: z.boolean().default(false),
  status: z.enum(['stable', 'draft']).default('stable'),
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
