import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* Converted to Astro 5 from the following Astro 4 content
 * declaration:
 *
 * export const fi = defineCollection({
 * type: 'content',
 * schema: z.object({
 *   name: z.string(),
 *   shortname: z.string().optional(),
 *   noun: z.string().optional(),
 *   description: z.string().optional(),
 * }),
 *});
 */
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/docs' }),
  schema: z.object({
    name: z.string(),
    shortname: z.string().optional(),
    noun: z.string().optional(),
    description: z.string().optional(),
  }),
});
export const collections = { docs };
